"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@auth0/nextjs-auth0";
import { EmailService } from "@/actions/emailService";

async function getGroupMembers(groupId: number) {
  return await prisma.groupMember.findMany({
    where: {
      groupId,
      status: "accepted",
    },
    include: {
      profile: true,
    },
  });
}

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

  const updatedGroup = await prisma.projectGroup.update({
    where: {
      id: groupId,
    },
    data: {
      status: newStatus,
    },
  });

  // Send email notifications to all group members
  for (const member of group.members) {
    if (member.profile && member.profile.email) {
      await EmailService.sendProjectUpdate(
        member.profile,
        group,
        `Project status has been updated to: ${newStatus}`
      );
    }
  }

  return updatedGroup;
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

  const group = await prisma.projectGroup.findUnique({
    where: { id: groupId },
    include: { members: { include: { profile: true } } },
  });

  if (!group) throw new Error("Group not found");

  const { assigneeIds, ...taskData } = data;

  const task = await prisma.task.create({
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
      assignedTo: true,
      group: true,
    },
  });

  // Send email notifications to assignees
  if (assigneeIds && assigneeIds.length > 0) {
    const assignees = await prisma.profile.findMany({
      where: {
        userId: {
          in: assigneeIds,
        },
      },
    });

    for (const assignee of assignees) {
      if (assignee.email) {
        await EmailService.sendTaskAssignment(task, assignee, group);
      }
    }
  }

  return task;
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
          members: {
            include: {
              profile: true,
            },
          },
        },
      },
      assignedTo: true,
    },
  });

  if (!task || !task.group.members.some((m) => m.userId === user.sub)) {
    throw new Error("Task not found or unauthorized");
  }

  const statusChangeComment =
    status === "completed"
      ? "Task approved by mentor"
      : status === "mentor-revision-requested"
      ? "Mentor requested revision"
      : null;

  if (statusChangeComment) {
    await prisma.comment.create({
      data: {
        content: statusChangeComment,
        taskId: taskId,
        userId: user.sub,
      },
    });
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: { status },
    include: {
      assignedTo: true,
    },
  });

  // Send email notifications to assignees and group members
  const members = await getGroupMembers(task.group.id);
  for (const member of members) {
    if (member.profile?.email) {
      await EmailService.sendProjectUpdate(
        member.profile,
        task.group,
        `Task "${task.title}" status updated to: ${status}`
      );
    }
  }

  return updatedTask;
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
          members: {
            include: {
              profile: true,
            },
          },
        },
      },
      assignedTo: true,
    },
  });

  if (!task || !task.group.members.some((m) => m.userId === user.sub)) {
    throw new Error("Task not found or unauthorized");
  }

  const { assigneeIds, ...updateData } = data;

  // Get current assignees for comparison
  const currentAssigneeIds = task.assignedTo.map((a) => a.userId);

  const updatedTask = await prisma.task.update({
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

  // Send notifications about task updates
  const members = await getGroupMembers(task.group.id);

  // Create update message based on what changed
  const changes: string[] = [];
  if (data.title && data.title !== task.title)
    changes.push(`title updated to "${data.title}"`);
  if (data.status && data.status !== task.status)
    changes.push(`status changed to "${data.status}"`);
  if (data.priority && data.priority !== task.priority)
    changes.push(`priority set to "${data.priority}"`);
  if (
    data.dueDate &&
    task.dueDate?.toISOString() !== data.dueDate.toISOString()
  )
    changes.push(`due date updated to ${data.dueDate.toLocaleDateString()}`);

  const updateMessage = `Task "${task.title}" has been updated: ${changes.join(
    ", "
  )}`;

  // Notify all group members about the update
  for (const member of members) {
    if (member.profile?.email) {
      await EmailService.sendProjectUpdate(
        member.profile,
        task.group,
        updateMessage
      );
    }
  }

  // Send specific notifications to new assignees
  if (assigneeIds) {
    const newAssigneeIds = assigneeIds.filter(
      (id) => !currentAssigneeIds.includes(id)
    );
    if (newAssigneeIds.length > 0) {
      const newAssignees = await prisma.profile.findMany({
        where: {
          userId: {
            in: newAssigneeIds,
          },
        },
      });

      for (const assignee of newAssignees) {
        if (assignee.email) {
          await EmailService.sendTaskAssignment(
            updatedTask,
            assignee,
            task.group
          );
        }
      }
    }
  }

  return updatedTask;
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

  const group = await prisma.projectGroup.findUnique({
    where: { id: groupId },
    include: { members: { include: { profile: true } } },
  });

  if (!group) throw new Error("Group not found");

  const discussion = await prisma.discussion.create({
    data: {
      ...data,
      groupId,
    },
  });

  // Notify all group members about the new discussion
  for (const member of group.members) {
    if (member.profile?.email) {
      await EmailService.sendProjectUpdate(
        member.profile,
        group,
        `New discussion created: "${data.title}"`
      );
    }
  }

  return discussion;
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

  const comment = await prisma.comment.create({
    data: {
      ...data,
      userId: user.sub,
    },
    include: {
      author: true,
      task: {
        include: {
          group: {
            include: {
              members: {
                include: {
                  profile: true,
                },
              },
            },
          },
        },
      },
      discussion: {
        include: {
          group: {
            include: {
              members: {
                include: {
                  profile: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Send notifications for task or discussion comments
  const group = comment.task?.group || comment.discussion?.group;
  if (group) {
    for (const member of group.members) {
      if (member.profile?.email) {
        await EmailService.sendProjectUpdate(
          member.profile,
          group,
          `New comment added to ${comment.task ? "task" : "discussion"}`
        );
      }
    }
  }

  return comment;
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

  const group = await prisma.projectGroup.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (!group) throw new Error("Group not found");

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

  const file = await prisma.projectFile.create({
    data: {
      ...data,
      groupId,
    },
  });

  // Send notifications to all group members about the new file
  for (const member of group.members) {
    if (member.profile?.email) {
      await EmailService.sendProjectUpdate(
        member.profile,
        group,
        `New file uploaded: "${data.name}" (${data.type})`
      );
    }
  }

  return file;
}

export async function scheduleMeeting(
  groupId: number,
  meetingData: {
    title: string;
    scheduledFor: Date;
    description?: string;
    meetLink?: string;
  }
) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const group = await prisma.projectGroup.findUnique({
    where: { id: groupId },
    include: { members: { include: { profile: true } } },
  });

  if (!group) throw new Error("Group not found");

  const meeting = await prisma.meeting.create({
    data: {
      ...meetingData,
      groupId: groupId,
      createdBy: user.sub,
    },
    include: {
      creatorProfile: true,
    },
  });

  // Send meeting notifications to all group members
  for (const member of group.members) {
    if (member.profile?.email) {
      await EmailService.sendMeetingNotification(
        member.profile,
        meeting,
        group
      );
    }
  }

  return meeting;
}

export async function shareResource(
  groupId: number,
  resource: {
    name: string;
    url: string;
    type: string;
    description: string;
  }
) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const group = await prisma.projectGroup.findUnique({
    where: { id: groupId },
    include: { members: { include: { profile: true } } },
  });

  if (!group) throw new Error("Group not found");

  const [file, discussion] = await prisma.$transaction([
    prisma.projectFile.create({
      data: {
        name: resource.name,
        url: resource.url,
        type: resource.type,
        size: 0,
        groupId: groupId,
        isResource: true,
      },
    }),
    prisma.discussion.create({
      data: {
        title: `New Resource: ${resource.name}`,
        content: JSON.stringify({
          type: resource.type,
          description: resource.description,
          url: resource.url,
        }),
        groupId: groupId,
      },
    }),
  ]);

  // Notify group members about the new resource
  for (const member of group.members) {
    if (member.profile?.email) {
      await EmailService.sendProjectUpdate(
        member.profile,
        group,
        `New resource shared: "${resource.name}"`
      );
    }
  }

  return { file, discussion };
}

export async function getMeetings(groupId: number) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  return await prisma.meeting.findMany({
    where: {
      groupId: groupId,
    },
    include: {
      creatorProfile: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      scheduledFor: "desc",
    },
  });
}

export async function updateMeetingStatus(meetingId: number, status: string) {
  const session = await getSession();
  const user = session?.user;

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      group: {
        include: {
          members: {
            include: {
              profile: true,
            },
          },
        },
      },
    },
  });

  if (!meeting) throw new Error("Meeting not found");

  const updatedMeeting = await prisma.meeting.update({
    where: { id: meetingId },
    data: { status },
  });

  // Notify group members about meeting status change
  for (const member of meeting.group.members) {
    if (member.profile?.email) {
      await EmailService.sendProjectUpdate(
        member.profile,
        meeting.group,
        `Meeting "${meeting.title}" status updated to: ${status}`
      );
    }
  }

  return updatedMeeting;
}
