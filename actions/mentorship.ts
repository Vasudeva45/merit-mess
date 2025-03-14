"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@auth0/nextjs-auth0";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { EmailService } from "@/actions/emailService";
import { cache } from "react";

// Validation Schemas
const MentorshipRequestSchema = z.object({
  mentorId: z.string(),
  projectGroupId: z.number(),
  message: z.string().optional(),
});

const MentorRatingSchema = z.object({
  mentorId: z.string(),
  rating: z.number().min(1).max(5),
});

// Helper types
type ProjectGroup = {
  name: string;
  form?: {
    name: string;
    description: string;
  };
};

// Cached Auth Helper
const getAuthenticatedUser = cache(async () => {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  return user;
});

// Cached DB Helpers
const getProjectWithMentor = cache(async (projectGroupId: number) => {
  return prisma.projectGroup.findUnique({
    where: { id: projectGroupId },
    select: {
      mentorId: true,
      mentor: { select: { name: true } },
    },
  });
});

const checkProjectOwnership = cache(
  async (userId: string, projectGroupId: number) => {
    return prisma.projectGroup.findFirst({
      where: {
        id: projectGroupId,
        members: {
          some: {
            userId: userId,
            role: "owner",
            status: "accepted",
          },
        },
      },
    });
  }
);

const getPendingMentorshipRequest = cache(async (projectGroupId: number) => {
  return prisma.mentorshipRequest.findFirst({
    where: {
      projectGroupId: projectGroupId,
      status: { in: ["pending", "mentor_invited", "accepted"] },
    },
  });
});

const getMentorProfile = cache(async (mentorId: string) => {
  return prisma.profile.findUnique({
    where: {
      userId: mentorId,
      type: "mentor",
      availableForMentorship: true,
    },
  });
});

// Main Functions
export async function createMentorshipRequest(input: {
  mentorId: string;
  projectGroupId: number;
  message?: string;
}) {
  const user = await getAuthenticatedUser();

  try {
    const decodedMentorId = decodeURIComponent(input.mentorId);

    // Parallel queries for faster execution
    const [existingMentor, isOwner, existingRequest, mentorProfile] =
      await Promise.all([
        getProjectWithMentor(input.projectGroupId),
        checkProjectOwnership(user.sub, input.projectGroupId),
        getPendingMentorshipRequest(input.projectGroupId),
        getMentorProfile(decodedMentorId),
      ]);

    // Validation checks
    if (existingMentor?.mentorId) {
      throw new Error(
        `This project already has a mentor (${existingMentor.mentor.name})`
      );
    }

    if (!isOwner) {
      throw new Error("Only project owners can send mentorship requests");
    }

    if (existingRequest) {
      throw new Error("This project already has a pending mentorship request");
    }

    if (!mentorProfile) {
      throw new Error(
        "Mentor profile not found or is not available for mentorship"
      );
    }

    // Create mentorship request
    const mentorshipRequest = await prisma.mentorshipRequest.create({
      data: {
        mentorId: decodedMentorId,
        projectGroupId: input.projectGroupId,
        requesterId: user.sub,
        message: input.message,
        status: "mentor_invited",
      },
      include: {
        projectGroup: {
          select: {
            name: true,
            form: {
              select: {
                name: true,
                description: true,
              },
            },
          },
        },
        requester: {
          select: {
            name: true,
            imageUrl: true,
            email: true,
          },
        },
        mentor: {
          select: {
            name: true,
            imageUrl: true,
            email: true,
          },
        },
      },
    });

    // Send email notification to mentor if email exists
    if (mentorshipRequest.mentor.email) {
      await EmailService.sendMentorRequest(
        mentorshipRequest,
        mentorshipRequest.mentor,
        mentorshipRequest.projectGroup
      );
    }

    // Batch revalidations
    revalidatePath(`/profile/${decodedMentorId}`);
    revalidatePath("/dashboard/mentorship-requests");

    return mentorshipRequest;
  } catch (error) {
    console.error("Mentorship Request Error:", error);
    throw error;
  }
}

export async function canRequestMentorship(projectGroupId: number) {
  const user = await getAuthenticatedUser();

  try {
    // Parallel queries for performance improvement
    const [existingMentor, isOwner, existingRequest] = await Promise.all([
      getProjectWithMentor(projectGroupId),
      checkProjectOwnership(user.sub, projectGroupId),
      getPendingMentorshipRequest(projectGroupId),
    ]);

    // If project has a mentor
    if (existingMentor?.mentorId) {
      return {
        canRequest: false,
        message: `This project already has a mentor (${existingMentor.mentor.name})`,
        existingMentor,
        existingRequest: null,
      };
    }

    return {
      canRequest: !!isOwner && !existingRequest && !existingMentor,
      message: !isOwner
        ? "Only project owners can request mentorship"
        : existingRequest
        ? "This project already has a pending mentorship request"
        : existingMentor
        ? `This project already has a mentor (${existingMentor.mentor.name})`
        : "Can request mentorship",
      existingRequest: existingRequest || null,
      existingMentor: existingMentor || null,
    };
  } catch (error) {
    console.error("Error checking mentorship request eligibility:", error);
    throw error;
  }
}

export async function getMyProjectGroups() {
  const user = await getAuthenticatedUser();

  return prisma.projectGroup.findMany({
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
  const user = await getAuthenticatedUser();

  return prisma.mentorshipRequest.findMany({
    where: {
      AND: [
        { mentorId: user.sub },
        { OR: [{ status: "mentor_invited" }, { status: "pending" }] },
      ],
    },
    include: {
      projectGroup: {
        select: {
          name: true,
          form: {
            select: {
              name: true,
              description: true,
            },
          },
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
  const user = await getAuthenticatedUser();

  // Fetch the request with related data in a single query
  const request = await prisma.mentorshipRequest.findUnique({
    where: { id: requestId },
    include: {
      projectGroup: true,
      requester: { select: { name: true, email: true } },
      mentor: { select: { name: true, email: true } },
    },
  });

  if (!request) {
    throw new Error("Mentorship request not found");
  }

  if (status === "accepted" && request.status === "mentor_invited") {
    // Use transaction to ensure data consistency
    const updatedRequest = await prisma.$transaction(async (tx) => {
      // Update project group and add mentor as member in parallel
      await Promise.all([
        tx.projectGroup.update({
          where: { id: request.projectGroupId },
          data: { mentorId: user.sub },
        }),
        tx.groupMember.create({
          data: {
            groupId: request.projectGroupId,
            userId: user.sub,
            role: "mentor",
            status: "accepted",
          },
        }),
      ]);

      // Update request status
      const result = await tx.mentorshipRequest.update({
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

      return result;
    });

    // Send email notification outside of transaction
    if (request.requester.email) {
      await EmailService.sendProjectUpdate(
        request.requester,
        request.projectGroup,
        `Your mentorship request has been accepted by ${request.mentor.name}!`
      );
    }

    // Batch revalidations
    revalidatePath("/dashboard/mentorship-requests");
    revalidatePath(`/profile/${user.sub}`);

    return updatedRequest;
  } else if (status === "rejected" && request.status === "mentor_invited") {
    const updatedRequest = await prisma.mentorshipRequest.update({
      where: { id: requestId },
      data: {
        status: "rejected",
        updatedAt: new Date(),
      },
    });

    if (request.requester.email) {
      await EmailService.sendProjectUpdate(
        request.requester,
        request.projectGroup,
        `Your mentorship request has been declined by ${request.mentor.name}.`
      );
    }

    revalidatePath("/dashboard/mentorship-requests");
    return updatedRequest;
  }

  throw new Error("Invalid mentorship request status update");
}

export async function rateMentor(input: { mentorId: string; rating: number }) {
  const user = await getAuthenticatedUser();
  const decodedMentorId = decodeURIComponent(input.mentorId);

  if (user.sub === decodedMentorId) {
    throw new Error("You cannot rate yourself");
  }

  try {
    const validatedInput = MentorRatingSchema.parse({
      ...input,
      mentorId: decodedMentorId,
    });

    // Get mentor profile and existing rating in parallel
    const [mentorProfile, existingRating] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId: decodedMentorId },
        select: { userId: true, name: true, email: true },
      }),
      prisma.mentorRating.findFirst({
        where: {
          mentorId: validatedInput.mentorId,
          raterId: user.sub,
        },
      }),
    ]);

    if (!mentorProfile) {
      throw new Error(
        `Mentor profile not found for user ID: ${decodedMentorId}`
      );
    }

    // Update or create rating
    let updatedMentorRating;
    if (existingRating) {
      updatedMentorRating = await prisma.mentorRating.update({
        where: { id: existingRating.id },
        data: { rating: validatedInput.rating },
      });
    } else {
      updatedMentorRating = await prisma.mentorRating.create({
        data: {
          mentorId: validatedInput.mentorId,
          raterId: user.sub,
          rating: validatedInput.rating,
        },
      });
    }

    // Get all mentor ratings
    const mentorRatings = await prisma.mentorRating.findMany({
      where: { mentorId: validatedInput.mentorId },
      select: { rating: true },
    });

    // Calculate average rating
    const averageRating =
      mentorRatings.length > 0
        ? mentorRatings.reduce((sum, r) => sum + r.rating, 0) /
          mentorRatings.length
        : 0;

    // Update mentor profile with new average rating
    await prisma.profile.update({
      where: { userId: validatedInput.mentorId },
      data: { mentorRating: averageRating },
    });

    // Get rater's name for notification
    const raterProfile = await prisma.profile.findUnique({
      where: { userId: user.sub },
      select: { name: true },
    });

    // Send email notification
    if (mentorProfile.email) {
      await EmailService.sendProjectUpdate(
        mentorProfile,
        { name: "Mentor Rating" } as ProjectGroup,
        `You've received a new ${input.rating}-star rating from ${
          raterProfile?.name || "a user"
        }!`
      );
    }

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
  const user = await getAuthenticatedUser();

  // Prevent rating yourself
  if (user.sub === mentorId) {
    return { hasRated: false, canRate: false };
  }

  const existingRating = await prisma.mentorRating.findFirst({
    where: {
      mentorId: mentorId,
      raterId: user.sub,
    },
    select: { rating: true },
  });

  return {
    hasRated: !!existingRating,
    canRate: true,
    existingRating: existingRating?.rating || null,
  };
}
