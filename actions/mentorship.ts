"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@auth0/nextjs-auth0";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation Schema
const MentorshipRequestSchema = z.object({
  mentorId: z.string(),
  projectGroupId: z.number(),
  message: z.string().optional(),
});

export async function createMentorshipRequest(input: {
  mentorId: string;
  projectGroupId: number;
  message?: string;
}) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  try {
    const decodedMentorId = decodeURIComponent(input.mentorId);

    // Verify mentor profile exists
    const mentorProfile = await prisma.profile.findUnique({
      where: {
        userId: decodedMentorId,
      },
    });

    if (!mentorProfile) {
      throw new Error(
        `Mentor profile not found for user ID: ${decodedMentorId}`
      );
    }

    // Check group membership
    const groupMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: input.projectGroupId,
        userId: user.sub,
        status: "accepted",
      },
    });

    if (!groupMembership) {
      throw new Error(
        "You must be a member of this project group to request mentorship"
      );
    }

    // Check for existing request
    const existingRequest = await prisma.mentorshipRequest.findFirst({
      where: {
        mentorId: decodedMentorId,
        projectGroupId: input.projectGroupId,
        requesterId: user.sub,
        status: {
          in: ["pending", "accepted", "mentor_invited"],
        },
      },
    });

    if (existingRequest) {
      throw new Error("A mentorship request for this project already exists");
    }

    // Create mentorship request with mentor_invited status
    const mentorshipRequest = await prisma.mentorshipRequest.create({
      data: {
        mentorId: decodedMentorId,
        projectGroupId: input.projectGroupId,
        requesterId: user.sub,
        message: input.message,
        status: "mentor_invited", // Changed to mentor_invited
      },
      include: {
        projectGroup: {
          select: {
            name: true,
          },
        },
        requester: {
          select: {
            name: true,
          },
        },
        mentor: {
          select: {
            name: true,
          },
        },
      },
    });

    // Revalidate relevant paths
    revalidatePath(`/profile/${decodedMentorId}`);
    revalidatePath("/dashboard/mentorship-requests");

    return mentorshipRequest;
  } catch (error) {
    console.error("Full Mentorship Request Error:", error);
    throw error;
  }
}

export async function getMyProjectGroups() {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  return await prisma.projectGroup.findMany({
    where: {
      members: {
        some: {
          userId: user.sub,
          status: "accepted",
        },
      },
    },
    select: {
      id: true,
      name: true,
      form: {
        select: {
          name: true,
          description: true,
        },
      },
    },
  });
}

export async function getMentorshipRequests() {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  return await prisma.mentorshipRequest.findMany({
    where: {
      OR: [
        { mentorId: user.sub, status: "mentor_invited" },
        { mentorId: user.sub, status: "pending" },
        { requesterId: user.sub },
      ],
    },
    include: {
      projectGroup: {
        select: {
          name: true,
        },
      },
      requester: {
        select: {
          name: true,
          imageUrl: true,
        },
      },
      mentor: {
        select: {
          name: true,
          imageUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function updateMentorshipRequestStatus(
  requestId: number,
  status: "accepted" | "rejected" | "mentor_invited"
) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  // Fetch the request with its related project group
  const request = await prisma.mentorshipRequest.findUnique({
    where: { id: requestId },
    include: {
      projectGroup: true,
    },
  });

  if (!request) {
    throw new Error("Mentorship request not found");
  }

  // Different logic based on the current status and the action
  if (status === "accepted" && request.status === "mentor_invited") {
    // When a mentor accepts the invitation, update the project group and the request
    const updatedRequest = await prisma.$transaction(async (prisma) => {
      // Update the project group to set the mentor
      await prisma.projectGroup.update({
        where: { id: request.projectGroupId },
        data: {
          mentorId: user.sub,
        },
      });

      // Add mentor as a group member
      await prisma.groupMember.create({
        data: {
          groupId: request.projectGroupId,
          userId: user.sub,
          role: "mentor",
          status: "accepted",
        },
      });

      // Update the mentorship request status
      return await prisma.mentorshipRequest.update({
        where: { id: requestId },
        data: {
          status: "accepted",
          updatedAt: new Date(),
        },
        include: {
          projectGroup: true,
          requester: true,
          mentor: true,
        },
      });
    });

    // Revalidate paths
    revalidatePath("/dashboard/mentorship-requests");
    revalidatePath(`/profile/${user.sub}`);

    return updatedRequest;
  } else if (status === "rejected" && request.status === "mentor_invited") {
    // If mentor rejects the invitation
    const updatedRequest = await prisma.mentorshipRequest.update({
      where: { id: requestId },
      data: {
        status: "rejected",
        updatedAt: new Date(),
      },
    });

    // Revalidate paths
    revalidatePath("/dashboard/mentorship-requests");

    return updatedRequest;
  }

  throw new Error("Invalid mentorship request status update");
}

const MentorRatingSchema = z.object({
  mentorId: z.string(),
  rating: z.number().min(1).max(5),
});

export async function rateMentor(input: { mentorId: string; rating: number }) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  // Decode the mentorId
  const decodedMentorId = decodeURIComponent(input.mentorId);

  console.log("Current User ID (from session):", user.sub);
  console.log("Mentor ID (decoded):", decodedMentorId);

  // Prevent rating yourself
  if (user.sub === decodedMentorId) {
    throw new Error("You cannot rate yourself");
  }

  try {
    // Validate input
    const validatedInput = MentorRatingSchema.parse({
      ...input,
      mentorId: decodedMentorId,
    });

    // Detailed profile lookup
    const mentorProfile = await prisma.profile.findUnique({
      where: {
        userId: decodedMentorId,
      },
      select: {
        userId: true,
        name: true,
      },
    });

    if (!mentorProfile) {
      throw new Error(
        `Mentor profile not found for user ID: ${decodedMentorId}`
      );
    }

    // Check if user has already rated this mentor
    const existingRating = await prisma.mentorRating.findFirst({
      where: {
        mentorId: validatedInput.mentorId,
        raterId: user.sub,
      },
    });

    let updatedMentorRating;

    if (existingRating) {
      // Update existing rating
      updatedMentorRating = await prisma.mentorRating.update({
        where: { id: existingRating.id },
        data: {
          rating: validatedInput.rating,
        },
      });
    } else {
      // Create new rating
      updatedMentorRating = await prisma.mentorRating.create({
        data: {
          mentorId: validatedInput.mentorId,
          raterId: user.sub,
          rating: validatedInput.rating,
        },
      });
    }

    // Recalculate mentor's average rating
    const mentorRatings = await prisma.mentorRating.findMany({
      where: { mentorId: validatedInput.mentorId },
    });

    const averageRating =
      mentorRatings.length > 0
        ? mentorRatings.reduce((sum, r) => sum + r.rating, 0) /
          mentorRatings.length
        : 0;

    // Update mentor's profile with new average rating
    await prisma.profile.update({
      where: { userId: validatedInput.mentorId },
      data: {
        mentorRating: averageRating,
      },
    });

    // Revalidate the mentor's profile path
    revalidatePath(`/profile/${validatedInput.mentorId}`);

    return {
      message: "Rating submitted successfully",
      averageRating,
    };
  } catch (error) {
    console.error("Mentor Rating Error:", error);
    throw error;
  }
}

export async function checkIfUserHasRatedMentor(mentorId: string) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  // Prevent rating yourself
  if (user.sub === mentorId) {
    return { hasRated: false, canRate: false };
  }

  const existingRating = await prisma.mentorRating.findFirst({
    where: {
      mentorId: mentorId,
      raterId: user.sub,
    },
  });

  return {
    hasRated: !!existingRating,
    canRate: true,
    existingRating: existingRating?.rating || null,
  };
}
