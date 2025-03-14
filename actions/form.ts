"use server";

import prisma from "@/lib/prisma";
import { formschema, formschemaType } from "@/schemas/form";
import { getSession } from "@auth0/nextjs-auth0";
import { v4 as uuidv4 } from "uuid";
import { EmailService } from "./emailService";
import { cache } from "react";

// Type definitions
type FormWithOwner = {
  id: number;
  name: string;
  description: string;
  domain: string;
  specialization: string;
  visits: number;
  createdAt: string;
  shareURL: string;
  status: string;
  owner: {
    name: string;
    imageUrl: string | null;
  } | null;
};

class UserNotFoundErr extends Error {
  constructor() {
    super("User not found");
    this.name = "UserNotFoundErr";
  }
}

// Utility functions
const getUserFromSession = async () => {
  const session = await getSession();
  const user = session?.user;

  if (!user || !user.sub) {
    throw new UserNotFoundErr();
  }

  return user;
};

// Cached user profile fetching
const getUserProfile = cache(async (userId: string) => {
  return await prisma.profile.findUnique({
    where: { userId },
    select: {
      userId: true,
      name: true,
      email: true,
      imageUrl: true,
    },
  });
});

export async function GetFormStats() {
  const user = await getUserFromSession();

  const stats = await prisma.form.aggregate({
    where: {
      userId: user.sub,
    },
    _sum: {
      visits: true,
      submissions: true,
    },
  });

  const visits = stats._sum.visits ?? 0;
  const submissions = stats._sum.submissions ?? 0;

  const submissionRate = visits > 0 ? (submissions / visits) * 100 : 0;
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
    throw new Error("Form not valid");
  }

  try {
    const user = await getUserFromSession();
    const { name, description, domain, specialization } = data;
    const formUid = uuidv4();

    const form = await prisma.form.create({
      data: {
        userId: user.sub,
        name,
        description: description ?? "",
        domain: domain ?? "",
        specialization: specialization ?? "",
        uid: formUid,
      },
    });

    if (!form) {
      throw new Error("Form creation failed");
    }

    // Send email notification in the background
    const userProfile = await getUserProfile(user.sub);
    if (userProfile?.email) {
      EmailService.sendFormCreationNotification(
        userProfile,
        form.name,
        form.id
      ).catch((err) => console.error("Email notification failed:", err));
    }

    return form.id;
  } catch (error) {
    console.error("Error in CreateForm:", error);
    throw error;
  }
}

export async function GetForms() {
  const user = await getUserFromSession();

  return await prisma.form.findMany({
    where: {
      userId: user.sub,
    },
    include: {
      projectGroup: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function GetFormById(id: number) {
  const user = await getUserFromSession();

  return await prisma.form.findUnique({
    where: {
      id,
      userId: user.sub, // Security check: ensure form belongs to user
    },
  });
}

export async function UpdateFormContent(id: number, jsonContent: string) {
  const user = await getUserFromSession();

  const form = await prisma.form.update({
    where: {
      userId: user.sub,
      id,
    },
    data: {
      content: jsonContent,
    },
    select: {
      name: true,
      id: true,
    },
  });

  // Send email notification in background
  const userProfile = await getUserProfile(user.sub);
  if (userProfile?.email) {
    EmailService.sendFormContentUpdateNotification(
      userProfile,
      form.name,
      form.id
    ).catch((err) => console.error("Email notification failed:", err));
  }

  return form;
}

export async function PublishForm(id: number) {
  const user = await getUserFromSession();

  const form = await prisma.form.update({
    where: {
      userId: user.sub,
      id,
    },
    data: {
      published: true,
    },
    select: {
      name: true,
      shareURL: true,
    },
  });

  // Send email notification in background
  const userProfile = await getUserProfile(user.sub);
  if (userProfile?.email) {
    EmailService.sendFormPublishedNotification(
      userProfile,
      form.name,
      form.shareURL
    ).catch((err) => console.error("Email notification failed:", err));
  }

  return form;
}

export async function GetFormContentByUrl(formUrl: string) {
  return await prisma.form.update({
    select: {
      content: true,
      userId: true,
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
  const user = await getUserFromSession();
  const userId = user.sub;

  // Efficient combined query to check form status and duplicates
  const formCheck = await prisma.form.findUnique({
    where: {
      shareURL: formUrl,
    },
    select: {
      id: true,
      name: true,
      status: true,
      userId: true,
      published: true,
      FormSubmissions: {
        where: {
          userId,
        },
        select: {
          id: true,
        },
      },
    },
  });

  // Form validation checks
  if (!formCheck || !formCheck.published) {
    throw new Error("FORM_NOT_FOUND");
  }

  if (formCheck.status === "closed") {
    throw new Error("FORM_CLOSED");
  }

  if (formCheck.FormSubmissions.length > 0) {
    throw new Error("DUPLICATE_SUBMISSION");
  }

  // Create submission and increment counter in a single transaction
  const submission = await prisma.$transaction(async (tx) => {
    // Create the submission
    const result = await tx.formSubmission.create({
      data: {
        content,
        userId,
        formId: formCheck.id,
      },
    });

    // Update form submission count
    await tx.form.update({
      where: {
        id: formCheck.id,
      },
      data: {
        submissions: {
          increment: 1,
        },
      },
    });

    return result;
  });

  // Send emails in the background after transaction completes
  Promise.all([
    // Get profiles for emails
    getUserProfile(userId),
    getUserProfile(formCheck.userId),
  ])
    .then(([submitterProfile, formOwnerProfile]) => {
      // Send confirmation to submitter
      if (submitterProfile?.email) {
        const submitterTemplate = {
          subject: `Submission Confirmed: ${formCheck.name}`,
          html: `
          <h2>Form Submission Confirmation</h2>
          <p>Hi ${submitterProfile.name},</p>
          <p>Your submission for "${formCheck.name}" has been received successfully.</p>
          <p>Thank you for your participation!</p>
          <p>If you need to reference this submission later, you can find it in your submissions history.</p>
          <br>
          <p>Best regards,</p>
          <p>The MeritMess Team</p>
        `,
        };

        EmailService.sendEmail(submitterProfile.email, submitterTemplate).catch(
          (err) => console.error("Failed to send submitter email:", err)
        );
      }

      // Send notification to form owner
      if (formOwnerProfile?.email) {
        const ownerTemplate = {
          subject: `New Submission: ${formCheck.name}`,
          html: `
          <h2>New Form Submission Received</h2>
          <p>Hi ${formOwnerProfile.name},</p>
          <p>You have received a new submission for "${formCheck.name}".</p>
          <p>Submission details:</p>
          <ul>
            <li>Submitted by: ${submitterProfile?.name || "Anonymous"}</li>
            <li>Date: ${new Date().toLocaleString()}</li>
          </ul>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/forms/${
            formCheck.id
          }/submissions">View Submission</a>
          <br>
          <p>Best regards,</p>
          <p>The MeritMess Team</p>
        `,
        };

        EmailService.sendEmail(formOwnerProfile.email, ownerTemplate).catch(
          (err) => console.error("Failed to send owner email:", err)
        );
      }
    })
    .catch((err) => console.error("Error sending notification emails:", err));

  return submission;
}

export async function CheckDuplicateSubmission(
  formUrl: string,
  userId: string
) {
  const submission = await prisma.formSubmission.findFirst({
    where: {
      form: {
        shareURL: formUrl,
      },
      userId,
    },
    select: {
      createdAt: true,
    },
  });

  return {
    hasDuplicate: !!submission,
    submissionDate: submission?.createdAt ?? null,
  };
}

export async function GetFormWithSubmissions(id: number) {
  const user = await getUserFromSession();

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

// Cache public forms for 1 minute
export const getPublicForms = cache(async () => {
  return await prisma.form.findMany({
    where: {
      published: true,
      NOT: {
        status: "closed",
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      domain: true,
      specialization: true,
      visits: true,
      createdAt: true,
      shareURL: true,
      status: true,
    },
  });
});

export async function UpdateFormStatus(id: number, status: string) {
  const user = await getUserFromSession();

  const form = await prisma.form.update({
    where: {
      userId: user.sub,
      id,
    },
    data: {
      status,
    },
    select: {
      name: true,
    },
  });

  // Send email notification in background
  const userProfile = await getUserProfile(user.sub);
  if (userProfile?.email) {
    EmailService.sendFormStatusUpdateNotification(
      userProfile,
      form.name,
      status
    ).catch((err) => console.error("Email notification failed:", err));
  }

  return form;
}

// Cache this function for 30 seconds to avoid repeated database calls
export const getPublicFormsWithOwners = cache(
  async (): Promise<FormWithOwner[]> => {
    // Get forms and related user IDs in a single query
    const forms = await prisma.form.findMany({
      where: {
        published: true,
        NOT: {
          status: "closed",
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        domain: true,
        specialization: true,
        visits: true,
        createdAt: true,
        shareURL: true,
        status: true,
        userId: true,
      },
    });

    // Extract unique user IDs
    const userIds = [...new Set(forms.map((form) => form.userId))];

    // Fetch all profiles in one batch
    const profiles = await prisma.profile.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
      select: {
        userId: true,
        name: true,
        imageUrl: true,
      },
    });

    // Create user ID to profile mapping
    const profileMap = new Map(
      profiles.map((profile) => [profile.userId, profile])
    );

    // Combine data and format for response
    return forms.map((form) => ({
      ...form,
      owner: profileMap.get(form.userId)
        ? {
            name: profileMap.get(form.userId)?.name || "",
            imageUrl: profileMap.get(form.userId)?.imageUrl,
          }
        : null,
      createdAt: form.createdAt.toISOString(),
    }));
  }
);
