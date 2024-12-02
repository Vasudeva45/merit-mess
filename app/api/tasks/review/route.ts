// app/api/tasks/review/route.ts
import { getSession } from "@auth0/nextjs-auth0";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user?.sub) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { taskId, status, comment, groupId } = await request.json();

    // Verify user is the mentor
    const group = await prisma.projectGroup.findFirst({
      where: {
        id: groupId,
        mentorId: user.sub,
      },
    });

    if (!group) {
      return new NextResponse("Not authorized as mentor", { status: 403 });
    }

    // Update task status and add comment if provided
    const updates = [
      prisma.task.update({
        where: { id: taskId },
        data: { status },
      }),
    ];

    if (comment) {
      updates.push(
        prisma.comment.create({
          data: {
            content: comment,
            taskId: taskId,
            userId: user.sub,
          },
        })
      );
    }

    await prisma.$transaction(updates);

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Review task error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
