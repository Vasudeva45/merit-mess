import PusherClient from "pusher-js";
import PusherServer from "pusher";
import { getSession } from "@auth0/nextjs-auth0";
import prisma from "./prisma";

// Server-side Pusher instance
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side Pusher instance
export const pusherClient =
  typeof window !== "undefined"
    ? new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      })
    : null;

// Helper function to safely get the Pusher client
export const getPusherClient = () => {
  if (!pusherClient) {
    throw new Error("Pusher client is not initialized");
  }
  return pusherClient;
};

// Update your addComment function
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
      author: {
        select: {
          name: true,
        },
      },
    },
  });

  // Trigger Pusher event after comment is created
  if (data.discussionId) {
    await pusherServer.trigger(
      `discussion-${data.discussionId}`,
      "new-comment",
      comment
    );
  }

  return comment;
}
