"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@auth0/nextjs-auth0";
import { v4 as uuidv4 } from "uuid";
import { EmailService } from "@/actions/emailService";

interface CreateGroupInput {
  formId: number;
  name: string;
  description?: string;
  selectedMembers: string[];
  groupId?: number;
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

  // If updating an existing group
  if (input.groupId) {
    const existingGroup = await prisma.projectGroup.findUnique({
      where: { id: input.groupId },
      include: { members: true },
    });

    if (!existingGroup) {
      throw new Error("Group not found");
    }

    const existingMemberIds = new Set(
      existingGroup.members.map((member) => member.userId)
    );

    const newMembers = input.selectedMembers.filter(
      (userId) => !existingMemberIds.has(userId)
    );

    const updatedGroup = await prisma.projectGroup.update({
      where: { id: input.groupId },
      data: {
        name: input.name,
        description: input.description,
        status: "active",
        members: {
          create: newMembers.map((userId) => ({
            userId,
            role: "member",
            status: "pending",
          })),
        },
      },
      include: {
        members: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Send invitation emails to new members
    for (const member of updatedGroup.members) {
      if (member.status === "pending" && member.profile.email) {
        await EmailService.sendTeamInvitation(member.profile, updatedGroup);
      }
    }

    return updatedGroup;
  }

  // If creating a new group
  const groupUid = uuidv4();
  const createdGroup = await prisma.projectGroup.create({
    data: {
      formId: input.formId,
      name: input.name,
      description: input.description,
      ownerId: user.sub,
      uid: groupUid,
      status: "active",
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
      members: {
        include: {
          profile: true,
        },
      },
    },
  });

  // Send invitation emails to all pending members
  for (const member of createdGroup.members) {
    if (member.status === "pending" && member.profile.email) {
      await EmailService.sendTeamInvitation(member.profile, createdGroup);
    }
  }

  return createdGroup;
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
          profile: {
            select: {
              name: true,
              skills: true,
              type: true,
              bio: true,
            },
          },
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
    include: {
      members: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (!group) {
    throw new Error("Group not found or unauthorized");
  }

  const updatedMember = await prisma.groupMember.update({
    where: {
      id: memberId,
    },
    data: {
      status,
    },
    include: {
      profile: true,
    },
  });

  // Send status update notification
  if (updatedMember.profile.email) {
    const statusMessage = `Your membership status for ${group.name} has been ${status}.`;
    await EmailService.sendProjectUpdate(
      updatedMember.profile,
      group,
      statusMessage
    );
  }

  return updatedMember;
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

  const pendingInvites = await prisma.groupMember.findMany({
    where: {
      userId: user.sub,
      status: "pending",
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

  return pendingInvites;
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

export async function updateGroupMember({
  groupId,
  userId,
  action,
}: {
  groupId: number;
  userId: string;
  action: "remove" | "update";
}) {
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
    include: {
      members: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (!group) {
    throw new Error("Group not found or unauthorized");
  }

  if (action === "remove") {
    // Find the member's profile before deletion
    const memberProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    const result = await prisma.groupMember.deleteMany({
      where: {
        groupId,
        userId,
      },
    });

    // Send removal notification if member has an email
    if (memberProfile?.email) {
      const removalMessage = `You have been removed from the project group: ${group.name}`;
      await EmailService.sendProjectUpdate(
        memberProfile,
        group,
        removalMessage
      );
    }

    return result;
  }
}

export async function getPublicProjects() {
  const projects = await prisma.projectGroup.findMany({
    where: {
      form: {
        published: true,
        NOT: {
          status: "closed",
        },
      },
    },
    include: {
      form: {
        select: {
          name: true,
          description: true,
          domain: true,
          specialization: true,
        },
      },
      members: {
        select: {
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
  });

  return projects.map((project) => ({
    title: project.name,
    description: project.form.description,
    skills: [project.form.domain, project.form.specialization].filter(Boolean),
    teamSize: `${project.members.length} members`,
    impact: "Creating meaningful project impact",
  }));
}
