// app/api/profile/[userId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const profile = await prisma.profile.findUnique({
      where: {
        userId: params.userId,
        type: 'mentor',
      },
      select: {
        userId: true,
        name: true,
        imageUrl: true,
        title: true,
        bio: true,
        organization: true,
        location: true,
        email: true,
        github: true,
        linkedin: true,
        mentorExpertise: true,
        yearsOfExperience: true,
        mentorRating: true,
        certifications: true,
        mentoredProjects: true,
        availableForMentorship: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Mentor profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentor profile' },
      { status: 500 }
    );
  }
}