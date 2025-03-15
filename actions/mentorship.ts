"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@auth0/nextjs-auth0";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { EmailService } from "@/actions/emailService";

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

    // 1. Check if project already has a mentor
    const existingMentor = await checkProjectMentor(input.projectGroupId);
    if (existingMentor?.mentorId) {
      throw new Error(
        `This project already has a mentor (${existingMentor.mentor.name})`
      );
    }

    // 2. Verify if the user is the project owner
    const isOwner = await isProjectOwner(user.sub, input.projectGroupId);
    if (!isOwner) {
      throw new Error("Only project owners can send mentorship requests");
    }

    // 3. Check if project already has a pending mentor request
    const existingRequest = await checkExistingMentorshipRequest(
      input.projectGroupId
    );
    if (existingRequest) {
      throw new Error("This project already has a pending mentorship request");
    }

    // 4. Verify mentor profile exists and is available
    const mentorProfile = await prisma.profile.findUnique({
      where: {
        userId: decodedMentorId,
        type: "mentor",
        availableForMentorship: true,
      },
    });

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

    // Send email notification to mentor
    if (mentorshipRequest.mentor.email) {
      await EmailService.sendMentorRequest(
        mentorshipRequest,
        mentorshipRequest.mentor,
        mentorshipRequest.projectGroup
      );
    }

    // Revalidate relevant paths
    revalidatePath(`/profile/${decodedMentorId}`);
    revalidatePath("/dashboard/mentorship-requests");

    return mentorshipRequest;
  } catch (error) {
    console.error("Mentorship Request Error:", error);
    throw error;
  }
}

export async function canRequestMentorship(projectGroupId: number) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  try {
    // Check if project has a mentor
    const existingMentor = await checkProjectMentor(projectGroupId);
    if (existingMentor?.mentorId) {
      return {
        canRequest: false,
        message: `This project already has a mentor (${existingMentor.mentor.name})`,
        existingMentor: existingMentor,
      };
    }

    // Check if user is project owner
    const isOwner = await isProjectOwner(user.sub, projectGroupId);

    // Check for existing requests
    const existingRequest = await checkExistingMentorshipRequest(
      projectGroupId
    );

    return {
      canRequest: isOwner && !existingRequest && !existingMentor,
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

async function checkProjectMentor(projectGroupId: number) {
  const project = await prisma.projectGroup.findUnique({
    where: {
      id: projectGroupId,
    },
    select: {
      mentorId: true,
      mentor: {
        select: {
          name: true,
        },
      },
    },
  });

  return project?.mentorId ? project : null;
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
      AND: [
        { mentorId: user.sub },
        {
          OR: [{ status: "mentor_invited" }, { status: "pending" }],
        },
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

async function checkExistingMentorshipRequest(projectGroupId: number) {
  const existingRequest = await prisma.mentorshipRequest.findFirst({
    where: {
      projectGroupId: projectGroupId,
      status: {
        in: ["pending", "mentor_invited", "accepted"],
      },
    },
  });
  return existingRequest;
}

async function isProjectOwner(userId: string, projectGroupId: number) {
  const projectGroup = await prisma.projectGroup.findFirst({
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
  return !!projectGroup;
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

  // Fetch the request with its related project group and profiles
  const request = await prisma.mentorshipRequest.findUnique({
    where: { id: requestId },
    include: {
      projectGroup: true,
      requester: true,
      mentor: true,
    },
  });

  if (!request) {
    throw new Error("Mentorship request not found");
  }

  if (status === "accepted" && request.status === "mentor_invited") {
    const updatedRequest = await prisma.$transaction(
      async (prisma) => {
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

        const result = await prisma.mentorshipRequest.update({
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
      },
      {
        // Increased timeout to 10 seconds (from the default 5 seconds)
        timeout: 10000,
      }
    );

    // Send email notification to requester about acceptance outside the transaction
    if (request.requester.email) {
      await EmailService.sendProjectUpdate(
        request.requester,
        request.projectGroup,
        `Your mentorship request has been accepted by ${request.mentor.name}!`
      );
    }

    // Revalidate paths
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

    // Send email notification to requester about rejection
    if (request.requester.email) {
      await EmailService.sendProjectUpdate(
        request.requester,
        request.projectGroup,
        `Your mentorship request has been declined by ${request.mentor.name}.`
      );
    }

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

  const decodedMentorId = decodeURIComponent(input.mentorId);

  console.log("Current User ID (from session):", user.sub);
  console.log("Mentor ID (decoded):", decodedMentorId);

  if (user.sub === decodedMentorId) {
    throw new Error("You cannot rate yourself");
  }

  try {
    const validatedInput = MentorRatingSchema.parse({
      ...input,
      mentorId: decodedMentorId,
    });

    const mentorProfile = await prisma.profile.findUnique({
      where: {
        userId: decodedMentorId,
      },
      select: {
        userId: true,
        name: true,
        email: true,
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
      updatedMentorRating = await prisma.mentorRating.update({
        where: { id: existingRating.id },
        data: {
          rating: validatedInput.rating,
        },
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

    // Fetch rater's profile for the notification
    const raterProfile = await prisma.profile.findUnique({
      where: {
        userId: user.sub,
      },
      select: {
        name: true,
      },
    });

    // Send email notification to mentor about new rating
    if (mentorProfile.email) {
      await EmailService.sendProjectUpdate(
        mentorProfile,
        { name: "Mentor Rating" } as ProjectGroup,
        `You've received a new ${input.rating}-star rating from ${
          raterProfile?.name || "a user"
        }!`
      );
    }

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
