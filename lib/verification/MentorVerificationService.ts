import { GitHubVerification } from "./github";
import { DocumentVerification } from "./document";
import { IdentityVerification } from "./identity";
import prisma from "@/lib/prisma";

export interface VerificationResult {
  success: boolean;
  status: string;
  details: {
    github?: any;
    documents?: any;
    identity?: any;
  };
  overallScore: number;
}

export class MentorVerificationService {
  private githubVerifier: GitHubVerification;
  private documentVerifier: DocumentVerification;
  private identityVerifier: IdentityVerification;

  constructor() {
    this.githubVerifier = new GitHubVerification(process.env.GITHUB_TOKEN!);
    this.documentVerifier = new DocumentVerification();
    this.identityVerifier = new IdentityVerification();
  }

  async verifyMentor(
    userId: string,
    data: {
      githubUsername?: string;
      documents?: Array<{ buffer: Buffer; type: string }>;
      email?: string;
      phoneNumber?: string;
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

      // Perform verifications in parallel
      const [githubResult, documentsResult, identityResult] = await Promise.all(
        [
          this.verifyGitHub(data.githubUsername),
          this.verifyDocuments(data.documents),
          this.verifyIdentity(data.email, data.phoneNumber),
        ]
      );

      // Calculate overall verification score
      const overallScore = this.calculateOverallScore({
        github: githubResult,
        documents: documentsResult,
        identity: identityResult,
      });

      // Determine verification status
      const status = this.determineVerificationStatus(overallScore);

      // Update verification record
      await prisma.mentorVerification.update({
        where: { id: verificationRecord.id },
        data: {
          status,
          githubVerified: githubResult.verified,
          githubData: githubResult,
          documentsVerified: documentsResult.verified,
          documents: documentsResult.results,
          identityVerified: identityResult.verified,
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
          documents: documentsResult,
          identity: identityResult,
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

  private async verifyDocuments(
    documents?: Array<{ buffer: Buffer; type: string }>
  ) {
    if (!documents?.length) {
      return { verified: false, results: [] };
    }
    return await this.documentVerifier.validateMultipleDocuments(documents);
  }

  private async verifyIdentity(email?: string, phoneNumber?: string) {
    const results = await Promise.all([
      email ? this.identityVerifier.sendEmailVerification(email) : false,
      phoneNumber
        ? this.identityVerifier.verifyPhoneNumber(phoneNumber)
        : false,
    ]);

    return {
      verified: results.some((result) => result),
      methods: {
        email: results[0],
        phone: results[1],
      },
    };
  }

  private calculateOverallScore(verifications: {
    github: any;
    documents: any;
    identity: any;
  }): number {
    const weights = {
      github: 0.4,
      documents: 0.4,
      identity: 0.2,
    };

    const scores = {
      github: verifications.github.verified ? verifications.github.score : 0,
      documents: verifications.documents.verified ? 100 : 0,
      identity: verifications.identity.verified ? 100 : 0,
    };

    return Math.round(
      scores.github * weights.github +
        scores.documents * weights.documents +
        scores.identity * weights.identity
    );
  }

  private determineVerificationStatus(score: number): string {
    if (score >= 80) return "verified";
    if (score >= 60) return "in_review";
    return "pending";
  }
}
