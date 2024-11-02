"use server";

import prisma from "@/lib/prisma";
import { formschema, formschemaType } from "@/schemas/form";
import { getSession } from "@auth0/nextjs-auth0";

class UserNotFoundErr extends Error {}

export async function GetFormStats() {
  const session = await getSession();
  const user = await session?.user;

  if (!user) {
    throw new UserNotFoundErr();
  }

  const stats = await prisma.form.aggregate({
    where: {
      userId: user.id,
    },
    _sum: {
      visits: true,
      submissions: true,
    },
  });

  const visits = stats._sum.visits ?? 0;
  const submissions = stats._sum.submissions ?? 0;

  let submissionRate = 0;

  if (visits > 0) {
    submissionRate = (submissions / visits) * 100;
  }

  const bouncedRate = 100 - submissionRate;

  return {
    visits,
    submissions,
    submissionRate,
    bouncedRate,
  };
}

export async function CreateForm(data: formschemaType) {
  const validation = formschema.safeParse(data);
  if (!validation.success) {
    throw new Error("form not valid");
  }

  try {
    const session = await getSession();
    const user = session?.user;

    if (!user || !user.sub) {
      console.error("User not found");
      throw new UserNotFoundErr();
    }

    const { name, description, domain, specialization } = data;

    const form = await prisma.form.create({
      data: {
        userId: user.sub,
        name,
        description: description ?? "",
        domain: domain ?? "",
        specialization: specialization ?? "",
      },
    });

    if (!form) {
      throw new Error("Something went wrong");
    }

    return form.id;
  } catch (error) {
    console.error("Error in CreateForm:", error);
    throw error;
  }
}
export async function GetForms() {
  const session = await getSession();
  const user = session?.user;

  if (!user || !user.sub) {
    console.error("User not found");
    throw new UserNotFoundErr();
  }

  return await prisma.form.findMany({
    where: {
      userId: user.sub,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function GetFormById(id: number) {
  const session = await getSession();
  const user = session?.user;

  if (!user || !user.sub) {
    console.error("User not found");
    throw new UserNotFoundErr();
  }

  return await prisma.form.findUnique({
    where: {
      userId: user.id,
      id,
    },
  });
}

export async function UpdateFormContent(id: number, jsonContent: string) {
  const session = await getSession();
  const user = session?.user;

  if (!user || !user.sub) {
    console.error("User not found");
    throw new UserNotFoundErr();
  }

  return await prisma.form.update({
    where: {
      userId: user.id,
      id,
    },
    data: {
      content: jsonContent,
    },
  });
}

export async function PublishForm(id: number) {
  const session = await getSession();
  const user = session?.user;

  if (!user || !user.sub) {
    console.error("User not found");
    throw new UserNotFoundErr();
  }

  return await prisma.form.update({
    where: {
      userId: user.sub, // Changed from user.id to user.sub
      id,
    },
    data: {
      published: true,
    },
  });
}

export async function GetFormContentByUrl(formUrl: string) {
  return await prisma.form.update({
    select: {
      content: true,
    },
    data: {
      visits: {
        increment: 1,
      },
    },
    where: {
      shareURL: formUrl,
    },
  });
}

export async function SubmitForm(formUrl: string, content: string) {
  return await prisma.form.update({
    data: {
      submissions: {
        increment: 1,
      },
      FormSubmissions: {
        create: {
          content,
        },
      },
    },
    where: {
      shareURL: formUrl,
      published: true,
    },
  });
}

export async function GetFormWithSubmissions(id: number) {
  const session = await getSession();
  const user = session?.user;

  if (!user || !user.sub) {
    console.error("User not found");
    throw new UserNotFoundErr();
  }

  return await prisma.form.findUnique({
    where: {
      userId: user.sub,
      id,
    },
    include: {
      FormSubmissions: true,
    },
  });
}
