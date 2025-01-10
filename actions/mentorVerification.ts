import { getSession } from "@auth0/nextjs-auth0";
import prisma from "@/lib/prisma";
import { GitHubVerification } from "@/lib/verification/github";
import { DocumentVerification } from "@/lib/verification/document";
import type {
  VerificationStatus,
  VerificationRequest,
} from "@/types/verification";

export async function initiateMentorVerification(data: VerificationRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.sub) {
      throw new Error("User not authenticated");
    }

    const existingVerification = await prisma.mentorVerification.findUnique({
      where: { userId: session.user.sub },
      include: { profile: true },
    });

    // Check eligibility
    const eligibility = await checkVerificationEligibility(session.user.sub);
    if (!eligibility.eligible) {
      throw new Error(`Verification not eligible: ${eligibility.reason}`);
    }

    if (existingVerification) {
      // Prevent updates if already verified
      if (existingVerification.status === "verified") {
        throw new Error("Profile already verified");
      }
      return await updateVerification(existingVerification.id, data);
    }

    // Validate GitHub username
    if (!data.githubUsername?.trim()) {
      throw new Error("GitHub username is required");
    }

    const verification = await prisma.mentorVerification.create({
      data: {
        userId: session.user.sub,
        githubUsername: data.githubUsername,
        status: "pending",
      },
    });

    // GitHub verification
    const githubVerifier = new GitHubVerification(process.env.GITHUB_TOKEN!);
    const githubResult = await githubVerifier.verifyProfile(
      data.githubUsername
    );

    await prisma.mentorVerification.update({
      where: { id: verification.id },
      data: {
        githubVerified: githubResult.verified,
        githubData: githubResult,
        status: githubResult.verified ? "in_review" : "pending",
      },
    });

    return verification;
  } catch (error) {
    console.error("Mentor verification error details:", {
      error: error.message,
      stack: error.stack,
      data: JSON.stringify(data),
    });
    throw new Error(error.message || "Failed to initiate mentor verification");
  }
}

async function updateVerification(id: number, data: VerificationRequest) {
  try {
    const updateData: any = {};

    if (data.githubUsername) {
      const githubVerifier = new GitHubVerification(process.env.GITHUB_TOKEN!);
      const githubResult = await githubVerifier.verifyProfile(
        data.githubUsername
      );

      updateData.githubUsername = data.githubUsername;
      updateData.githubVerified = githubResult.verified;
      updateData.githubData = githubResult;
    }

    if (data.documents?.length) {
      const documentVerifier = new DocumentVerification();
      const documentsResult = await documentVerifier.validateMultipleDocuments(
        data.documents
      );

      updateData.documentsVerified = documentsResult.verified;
      updateData.documents = documentsResult.results;
    }

    const verification = await prisma.mentorVerification.update({
      where: { id },
      data: updateData,
    });

    return verification;
  } catch (error) {
    console.error("Error updating verification:", error);
    throw new Error("Failed to update verification");
  }
}

export async function getVerificationStatus(
  userId: string
): Promise<VerificationStatus | null> {
  try {
    const verification = await prisma.mentorVerification.findUnique({
      where: { userId },
    });

    return verification;
  } catch (error) {
    console.error("Error fetching verification status:", error);
    throw new Error("Failed to fetch verification status");
  }
}

export async function checkVerificationEligibility(userId: string) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        type: true,
        mentorVerification: true,
      },
    });

    if (!profile) {
      return { eligible: false, reason: "Profile not found" };
    }

    if (profile.type !== "mentor") {
      return { eligible: false, reason: "Profile is not a mentor type" };
    }

    if (profile.mentorVerification?.status === "verified") {
      return { eligible: false, reason: "Already verified" };
    }

    return { eligible: true };
  } catch (error) {
    console.error("Error checking verification eligibility:", error);
    throw new Error("Failed to check verification eligibility");
  }
}
