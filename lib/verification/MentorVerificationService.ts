import { GitHubVerification } from "./github";
import prisma from "@/lib/prisma";

export interface VerificationResult {
  success: boolean;
  status: string;
  details: {
    github: any;
  };
  overallScore: number;
}

export class MentorVerificationService {
  private githubVerifier: GitHubVerification;

  constructor() {
    this.githubVerifier = new GitHubVerification(process.env.GITHUB_TOKEN!);
  }

  async verifyMentor(
    userId: string,
    data: {
      githubUsername?: string;
    }
  ): Promise<VerificationResult> {
    try {
      // Initialize verification record
      let verificationRecord = await prisma.mentorVerification.findUnique({
        where: { userId },
      });

      if (!verificationRecord) {
        verificationRecord = await prisma.mentorVerification.create({
          data: {
            userId,
            status: "pending",
          },
        });
      }

      // Perform GitHub verification
      const githubResult = await this.verifyGitHub(data.githubUsername);

      // Calculate overall verification score
      const overallScore = this.calculateOverallScore(githubResult);

      // Determine verification status
      const status = this.determineVerificationStatus(overallScore);

      // Update verification record
      await prisma.mentorVerification.update({
        where: { id: verificationRecord.id },
        data: {
          status,
          githubVerified: githubResult.verified,
          githubData: githubResult,
          verificationDate: new Date(),
        },
      });

      // If verified, update profile
      if (status === "verified") {
        await prisma.profile.update({
          where: { userId },
          data: {
            type: "mentor",
            availableForMentorship: true,
          },
        });
      }

      return {
        success: true,
        status,
        details: {
          github: githubResult,
        },
        overallScore,
      };
    } catch (error) {
      console.error("Mentor verification error:", error);
      throw new Error("Failed to complete mentor verification");
    }
  }

  private async verifyGitHub(username?: string) {
    if (!username) {
      return { verified: false, score: 0 };
    }
    return await this.githubVerifier.verifyProfile(username);
  }

  private calculateOverallScore(githubResult: any): number {
    return Math.round(githubResult.verified ? githubResult.score : 0);
  }

  private determineVerificationStatus(score: number): string {
    if (score >= 80) return "verified";
    if (score >= 60) return "in_review";
    return "pending";
  }
}
