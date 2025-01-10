import { MentorVerificationService } from "@/lib/verification/MentorVerificationService";
import { getSession } from "@auth0/nextjs-auth0";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const verificationService = new MentorVerificationService();

    const result = await verificationService.verifyMentor(session.user.sub, {
      githubUsername: data.githubUsername,
      documents: data.documents,
      email: session.user.email,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}
