import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MentorVerificationService } from "@/lib/verification/MentorVerificationService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get verification status from database
    const verificationRecord = await prisma.mentorVerification.findUnique({
      where: { userId },
    });

    if (!verificationRecord) {
      return NextResponse.json({
        githubVerified: false,
        documentsVerified: false,
        identityVerified: false,
        overallStatus: "pending",
      });
    }

    // Calculate overall status
    const verificationService = new MentorVerificationService();
    const overallScore = verificationService.calculateOverallScore({
      github: {
        verified: verificationRecord.githubVerified,
        score: verificationRecord.githubData?.score || 0,
      },
      documents: {
        verified: verificationRecord.documentsVerified,
        results: verificationRecord.documents || [],
      },
      identity: {
        verified: verificationRecord.identityVerified,
        methods: verificationRecord.identityMethods || {},
      },
    });

    return NextResponse.json({
      githubVerified: verificationRecord.githubVerified,
      documentsVerified: verificationRecord.documentsVerified,
      identityVerified: verificationRecord.identityVerified,
      overallStatus:
        verificationService.determineVerificationStatus(overallScore),
      score: overallScore,
    });
  } catch (error) {
    console.error("Verification status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification status" },
      { status: 500 }
    );
  }
}
