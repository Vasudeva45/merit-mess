"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@auth0/nextjs-auth0";

// Get detailed project information
export async function getProjectDetails(groupId: number) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  return await prisma.projectGroup.findFirst({
    where: {
      id: groupId,
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
              userId: true,
              name: true,
              email: true,
              title: true,
            },
          },
        },
      },
      tasks: {
        include: {
          assignedTo: {
            select: {
              name: true,
              userId: true,
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      discussions: {
        include: {
          comments: {
            include: {
              author: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      files: true,
      form: {
        select: {
          name: true,
          description: true,
        },
      },
      mentor: {
        select: {
          userId: true,
          name: true,
          title: true,
          mentorExpertise: true,
          mentorRating: true,
          email: true,
        },
      },
    },
  });
}

export async function updateProjectStatus(groupId: number, newStatus: string) {
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

  return await prisma.projectGroup.update({
    where: {
      id: groupId,
    },
    data: {
      status: newStatus,
    },
  });
}

// Create a new task
export async function createTask(
  groupId: number,
  data: {
    title: string;
    description?: string;
    priority?: string;
    dueDate?: Date;
    assigneeIds?: string[];
  }
) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  // Verify user is a member of the group
  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId: user.sub,
      status: "accepted",
    },
  });

  if (!membership) {
    throw new Error("Not a member of this group");
  }

  const { assigneeIds, ...taskData } = data;

  return await prisma.task.create({
    data: {
      ...taskData,
      groupId,
      ...(assigneeIds && assigneeIds.length > 0
        ? {
            assignedTo: {
              connect: assigneeIds.map((id) => ({ userId: id })),
            },
          }
        : {}),
    },
    include: {
      assignedTo: {
        select: {
          name: true,
          userId: true,
        },
      },
    },
  });
}
// Update task status
export async function updateTaskStatus(taskId: number, status: string) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      group: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!task || !task.group.members.some((m) => m.userId === user.sub)) {
    throw new Error("Task not found or unauthorized");
  }

  return await prisma.task.update({
    where: { id: taskId },
    data: { status },
    include: {
      assignedTo: {
        select: {
          name: true,
          userId: true,
        },
      },
    },
  });
}

export async function updateTask(
  taskId: number,
  data: {
    status?: string;
    title?: string;
    description?: string;
    priority?: string;
    dueDate?: Date;
    assigneeIds?: string[];
  }
) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      group: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!task || !task.group.members.some((m) => m.userId === user.sub)) {
    throw new Error("Task not found or unauthorized");
  }

  const { assigneeIds, ...updateData } = data;

  return await prisma.task.update({
    where: { id: taskId },
    data: {
      ...updateData,
      ...(assigneeIds && {
        assignedTo: {
          set: assigneeIds.map((id) => ({ userId: id })),
        },
      }),
    },
    include: {
      assignedTo: {
        select: {
          name: true,
          userId: true,
        },
      },
      comments: {
        include: {
          author: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

// Create a discussion
export async function createDiscussion(
  groupId: number,
  data: {
    title: string;
    content: string;
  }
) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId: user.sub,
      status: "accepted",
    },
  });

  if (!membership) {
    throw new Error("Not a member of this group");
  }

  return await prisma.discussion.create({
    data: {
      ...data,
      groupId,
    },
  });
}

// Add comment
export async function addComment(data: {
  content: string;
  taskId?: number;
  discussionId?: number;
}) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  return await prisma.comment.create({
    data: {
      ...data,
      userId: user.sub,
    },
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
  });
}

// Upload file (metadata only - actual upload would be handled separately)
export async function createFileRecord(
  groupId: number,
  data: {
    name: string;
    url: string;
    type: string;
    size: number;
  }
) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId: user.sub,
      status: "accepted",
    },
  });

  if (!membership) {
    throw new Error("Not a member of this group");
  }

  return await prisma.projectFile.create({
    data: {
      ...data,
      groupId,
    },
  });
}
