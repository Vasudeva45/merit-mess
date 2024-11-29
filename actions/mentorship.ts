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

export async function createMentorshipRequest(
  input: z.infer<typeof MentorshipRequestSchema>
) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  // Validate input
  const validatedInput = MentorshipRequestSchema.parse(input);

  try {
    // Decode the mentor ID
    const decodedMentorId = decodeURIComponent(validatedInput.mentorId);
    console.log("Decoded Mentor ID:", decodedMentorId);

    // Verify mentor profile exists before creating the request
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

    const groupMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: validatedInput.projectGroupId,
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
        projectGroupId: validatedInput.projectGroupId,
        requesterId: user.sub,
        status: {
          in: ["pending", "accepted"],
        },
      },
    });

    if (existingRequest) {
      throw new Error("A mentorship request for this project already exists");
    }

    // Create mentorship request
    const mentorshipRequest = await prisma.mentorshipRequest.create({
      data: {
        mentorId: decodedMentorId,
        projectGroupId: validatedInput.projectGroupId,
        requesterId: user.sub,
        message: validatedInput.message,
        status: "pending",
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
    // Enhanced error logging
    console.error("Full Mentorship Request Error:", error);

    // More specific error handling
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        throw new Error(
          `Invalid mentor ID: ${validatedInput.mentorId}. The mentor may not exist in the system.`
        );
      }
    }

    // Re-throw the original error if it's not a known Prisma error
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

  // Fetch requests where the user is either the mentor or the requester
  return await prisma.mentorshipRequest.findMany({
    where: {
      OR: [{ mentorId: user.sub }, { requesterId: user.sub }],
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
  status: "accepted" | "rejected"
) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  // Verify the user is the mentor for this request
  const request = await prisma.mentorshipRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.mentorId !== user.sub) {
    throw new Error("Unauthorized to update this request");
  }

  const updatedRequest = await prisma.mentorshipRequest.update({
    where: { id: requestId },
    data: {
      status,
      updatedAt: new Date(),
    },
    include: {
      projectGroup: true,
      requester: true,
      mentor: true,
    },
  });

  // Revalidate paths
  revalidatePath("/dashboard/mentorship-requests");
  revalidatePath(`/profile/${request.requesterId}`);

  return updatedRequest;
}
