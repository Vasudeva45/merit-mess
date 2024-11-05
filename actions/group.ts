"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@auth0/nextjs-auth0";
import { v4 as uuidv4 } from "uuid";

interface CreateGroupInput {
  formId: number;
  name: string;
  description?: string;
  selectedMembers: string[];
}

export async function createProjectGroup(input: CreateGroupInput) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const form = await prisma.form.findUnique({
    where: {
      id: input.formId,
      userId: user.sub,
    },
  });

  if (!form) {
    throw new Error("Form not found or unauthorized");
  }

  const groupUid = uuidv4(); // Generate a unique UUID for the group

  const group = await prisma.projectGroup.create({
    data: {
      formId: input.formId,
      name: input.name,
      description: input.description,
      ownerId: user.sub,
      uid: groupUid, // Add the UUID to the group
      members: {
        create: [
          {
            userId: user.sub,
            role: "owner",
            status: "accepted",
          },
          ...input.selectedMembers.map((userId) => ({
            userId,
            role: "member",
            status: "pending",
          })),
        ],
      },
    },
    include: {
      members: true,
    },
  });

  return group;
}

export async function getProjectGroup(formId: number) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  return await prisma.projectGroup.findUnique({
    where: {
      formId: formId,
    },
    include: {
      members: {
        include: {
          // You might want to include user profile information here
        },
      },
    },
  });
}

export async function updateMemberStatus(
  groupId: number,
  memberId: number,
  status: "accepted" | "rejected"
) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const group = await prisma.projectGroup.findUnique({
    where: {
      id: groupId,
      ownerId: user.sub,
    },
  });

  if (!group) {
    throw new Error("Group not found or unauthorized");
  }

  return await prisma.groupMember.update({
    where: {
      id: memberId,
    },
    data: {
      status,
    },
  });
}

export async function getFormSubmissionsWithProfiles(formId: number) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const form = await prisma.form.findUnique({
    where: {
      id: formId,
      userId: user.sub,
    },
  });

  if (!form) {
    throw new Error("Form not found or unauthorized");
  }

  return await prisma.formSubmissions.findMany({
    where: {
      formId: formId,
    },
    include: {
      profile: {
        select: {
          name: true,
          skills: true,
          type: true,
          bio: true,
        },
      },
    },
  });
}

export async function getProjectInvites() {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  return await prisma.groupMember.findMany({
    where: {
      userId: user.sub,
      NOT: {
        role: "owner",
      },
    },
    include: {
      group: {
        include: {
          form: {
            select: {
              name: true,
              description: true,
            },
          },
        },
      },
    },
  });
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
    include: {
      members: {
        include: {
          profile: {
            select: {
              name: true,
            },
          },
        },
      },
      form: {
        select: {
          name: true,
          description: true,
        },
      },
    },
  });
}
