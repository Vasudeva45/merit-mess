import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // First, let's check if we have any profiles at all
    const allProfiles = await prisma.profile.findMany();
    console.log("Total profiles in database:", allProfiles.length);

    // Now check specifically for mentor profiles
    const mentors = await prisma.profile.findMany({
      where: {
        type: "mentor",
        availableForMentorship: true,
      },
      select: {
        userId: true,
        name: true,
        imageUrl: true,
        title: true,
        organization: true,
        mentorExpertise: true,
        yearsOfExperience: true,
        mentorRating: true,
      },
    });

    console.log("Found mentors:", mentors.length);
    console.log("Mentor data:", JSON.stringify(mentors, null, 2));

    return NextResponse.json(mentors);
  } catch (error) {
    console.error("Error fetching mentors:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentors" },
      { status: 500 }
    );
  }
}
