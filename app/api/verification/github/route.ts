import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GitHubVerification } from "@/lib/verification/github";
import { getSession } from "@auth0/nextjs-auth0";
import prisma from "@/lib/prisma";
import crypto from "crypto";

const pendingVerifications = new Map<
  string,
  {
    code: string;
    expires: number;
    username: string;
  }
>();

// Minimum requirements for GitHub profile
const MINIMUM_REQUIREMENTS = {
  accountAgeInDays: 0, // Modified from 180
  minRepos: 0, // Modified from 3
  minContributions: 0, // Modified from 50
  minFollowers: 0, // Modified from 5
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { githubUsername, profileData, action } = data;

    if (!githubUsername) {
      return NextResponse.json(
        { error: "GitHub username required" },
        { status: 400 }
      );
    }

    const verifier = new GitHubVerification(process.env.GITHUB_TOKEN!);

    // First check if profile meets minimum requirements
    if (action === "initiate") {
      const preCheck = await verifier.verifyProfile(githubUsername, "");
      const meetsRequirements = checkMinimumRequirements(preCheck.details);

      if (!meetsRequirements.passed) {
        return NextResponse.json({
          success: false,
          verified: false,
          requirementsCheck: false,
          error: "GitHub profile does not meet minimum requirements",
          details: {
            requirements: MINIMUM_REQUIREMENTS,
            current: preCheck.details,
            failing: meetsRequirements.failing,
          },
        });
      }

      // If requirements are met, proceed with code generation
      const verificationCode = crypto.randomBytes(4).toString("hex");
      pendingVerifications.set(session.user.sub, {
        code: verificationCode,
        expires: Date.now() + 30 * 60 * 1000,
        username: githubUsername,
      });

      return NextResponse.json({
        success: true,
        requirementsCheck: true,
        verificationCode,
        instructions: `Please verify your GitHub account ownership by doing ONE of the following:
          1. Create a public repository named 'verification-repo' with a file containing the code
          2. Create a public gist containing the code
          3. Add the code to your GitHub bio temporarily`,
      });
    }

    // For verification request
    const pendingVerification = pendingVerifications.get(session.user.sub);
    if (!pendingVerification || Date.now() > pendingVerification.expires) {
      return NextResponse.json(
        { error: "Verification code expired or not found" },
        { status: 400 }
      );
    }

    if (pendingVerification.username !== githubUsername) {
      return NextResponse.json(
        { error: "GitHub username does not match verification request" },
        { status: 400 }
      );
    }

    const result = await verifier.verifyProfile(
      githubUsername,
      pendingVerification.code
    );

    if (result.verified) {
      pendingVerifications.delete(session.user.sub);

      // Double check requirements one last time
      const meetsRequirements = checkMinimumRequirements(result.details);

      if (!meetsRequirements.passed) {
        return NextResponse.json({
          success: true,
          verified: true,
          requirementsMet: false,
          error: "Account verified but does not meet minimum requirements",
          details: {
            requirements: MINIMUM_REQUIREMENTS,
            current: result.details,
            failing: meetsRequirements.failing,
          },
        });
      }

      // Only create/update verification record if all requirements are met
      // Removed the unused verification variable
      await prisma.MentorVerification.upsert({
        where: { userId: session.user.sub },
        update: {
          githubUsername,
          githubVerified: true,
          githubData: result,
          status: "verified",
          verificationDate: new Date(),
        },
        create: {
          userId: session.user.sub,
          githubUsername,
          githubVerified: true,
          githubData: result,
          status: "verified",
          verificationDate: new Date(),
        },
      });

      if (profileData) {
        const processedProfile = await processProfileData(
          profileData,
          session.user.sub
        );
        await createOrUpdateProfile(processedProfile, session.user.sub);
      }

      const cookieStore = await cookies();
      cookieStore.set(
        "github_verification",
        JSON.stringify({
          verified: true,
          username: githubUsername,
          score: result.score,
        }),
        {
          secure: true,
          httpOnly: true,
          sameSite: "strict",
        }
      );

      return NextResponse.json({
        success: true,
        verified: true,
        requirementsMet: true,
        score: result.score,
        details: result.details,
      });
    }

    return NextResponse.json({
      success: false,
      verified: false,
      error: "GitHub profile ownership verification failed",
      details: result.details,
    });
  } catch (error) {
    console.error("GitHub verification error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function checkMinimumRequirements(details: {
  accountAge: number;
  repositories: number;
  contributions: number;
  followers: number;
}) {
  const failing = [];

  if (details.accountAge < MINIMUM_REQUIREMENTS.accountAgeInDays) {
    failing.push({
      requirement: "Account Age",
      current: `${Math.floor(details.accountAge)} days`,
      minimum: `${MINIMUM_REQUIREMENTS.accountAgeInDays} days`,
    });
  }

  if (details.repositories < MINIMUM_REQUIREMENTS.minRepos) {
    failing.push({
      requirement: "Public Repositories",
      current: details.repositories,
      minimum: MINIMUM_REQUIREMENTS.minRepos,
    });
  }

  if (details.contributions < MINIMUM_REQUIREMENTS.minContributions) {
    failing.push({
      requirement: "Contributions",
      current: details.contributions,
      minimum: MINIMUM_REQUIREMENTS.minContributions,
    });
  }

  if (details.followers < MINIMUM_REQUIREMENTS.minFollowers) {
    failing.push({
      requirement: "Followers",
      current: details.followers,
      minimum: MINIMUM_REQUIREMENTS.minFollowers,
    });
  }

  return {
    passed: failing.length === 0,
    failing,
  };
}

// Use an interface for profileData
interface ProfileData {
  name?: string;
  email?: string;
  skills?: string[] | string;
  achievements?: string[] | string;
  ongoing_projects?: unknown[];
  mentorDetails?: {
    expertise?: string;
    yearsOfExperience?: string | number;
    certifications?: string;
  };
}

async function processProfileData(profileData: ProfileData, userId: string) {
  return {
    userId,
    type: "mentor",
    name: profileData.name,
    email: profileData.email,
    skills: Array.isArray(profileData.skills)
      ? profileData.skills
      : String(profileData.skills || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
    achievements: Array.isArray(profileData.achievements)
      ? profileData.achievements
      : String(profileData.achievements || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
    ongoing_projects: profileData.ongoing_projects || [],
    mentorExpertise: String(profileData.mentorDetails?.expertise || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    yearsOfExperience:
      parseInt(String(profileData.mentorDetails?.yearsOfExperience)) || 0,
    certifications: String(profileData.mentorDetails?.certifications || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    availableForMentorship: true,
  };
}

interface ProcessedProfile {
  userId: string;
  type: string;
  name?: string;
  email?: string;
  skills: string[];
  achievements: string[];
  ongoing_projects: unknown[];
  mentorExpertise: string[];
  yearsOfExperience: number;
  certifications: string[];
  availableForMentorship: boolean;
}

async function createOrUpdateProfile(
  processedProfile: ProcessedProfile,
  userId: string
) {
  return await prisma.profile.upsert({
    where: { userId },
    update: processedProfile,
    create: processedProfile,
  });
}
