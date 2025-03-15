"use server";

import prisma from "@/lib/prisma";
import { formschema, formschemaType } from "@/schemas/form";
import { getSession } from "@auth0/nextjs-auth0";
import { v4 as uuidv4 } from "uuid";
import { EmailService } from "./emailService";

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

class UserNotFoundErr extends Error {}

export async function GetFormStats() {
  const session = await getSession();
  const user = await session?.user;

  if (!user) {
    throw new UserNotFoundErr();
  }

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
      throw new Error("Something went wrong");
    }

    // Send email notification
    const userProfile = await prisma.profile.findUnique({
      where: { userId: user.sub },
    });

    if (userProfile) {
      await EmailService.sendFormCreationNotification(
        userProfile,
        form.name,
        form.id
      );
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
    include: {
      projectGroup: true,
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

  const form = await prisma.form.update({
    where: {
      userId: user.sub,
      id,
    },
    data: {
      content: jsonContent,
    },
  });

  // Send email notification
  const userProfile = await prisma.profile.findUnique({
    where: { userId: user.sub },
  });

  if (userProfile) {
    await EmailService.sendFormContentUpdateNotification(
      userProfile,
      form.name,
      form.id
    );
  }

  return form;
}

export async function PublishForm(id: number) {
  const session = await getSession();
  const user = session?.user;

  if (!user || !user.sub) {
    console.error("User not found");
    throw new UserNotFoundErr();
  }

  const form = await prisma.form.update({
    where: {
      userId: user.sub,
      id,
    },
    data: {
      published: true,
    },
  });

  // Send email notification
  const userProfile = await prisma.profile.findUnique({
    where: { userId: user.sub },
  });

  if (userProfile) {
    await EmailService.sendFormPublishedNotification(
      userProfile,
      form.name,
      form.shareURL
    );
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
  console.log("Starting form submission process for URL:", formUrl);
  const session = await getSession();
  const user = session?.user;

  if (!user || !user.sub) {
    console.error("No user found in session");
    throw new Error("UNAUTHORIZED");
  }

  console.log("User authenticated:", user.sub);

  // First, get the form details before submission
  const existingForm = await prisma.form.findUnique({
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
          userId: user.sub,
        },
      },
    },
  });

  console.log("Existing form details:", {
    formFound: !!existingForm,
    formStatus: existingForm?.status,
    isPublished: existingForm?.published,
  });

  // Check if form exists and is published
  if (!existingForm || !existingForm.published) {
    console.error("Form not found or not published");
    throw new Error("FORM_NOT_FOUND");
  }

  // Check if form is accepting submissions
  if (existingForm.status === "closed") {
    console.error("Form is closed for submissions");
    throw new Error("FORM_CLOSED");
  }

  // Check for duplicate submissions
  if (existingForm.FormSubmissions.length > 0) {
    console.error("Duplicate submission detected");
    throw new Error("DUPLICATE_SUBMISSION");
  }

  try {
    console.log("Creating form submission in database...");

    // Submit the form
    const submission = await prisma.form.update({
      where: {
        shareURL: formUrl,
      },
      data: {
        submissions: {
          increment: 1,
        },
        FormSubmissions: {
          create: {
            content,
            userId: user.sub,
          },
        },
      },
    });

    console.log("Form submission created successfully");

    // Get submitter's profile for email notification
    console.log("Fetching submitter's profile...");
    const submitterProfile = await prisma.profile.findUnique({
      where: { userId: user.sub },
      select: {
        name: true,
        email: true,
      },
    });

    console.log("Submitter profile found:", {
      name: submitterProfile?.name,
      hasEmail: !!submitterProfile?.email,
    });

    // Get form owner's profile for email notification
    console.log("Fetching form owner's profile...");
    const formOwnerProfile = await prisma.profile.findUnique({
      where: { userId: existingForm.userId },
      select: {
        name: true,
        email: true,
      },
    });

    console.log("Form owner profile found:", {
      name: formOwnerProfile?.name,
      hasEmail: !!formOwnerProfile?.email,
    });

    // Send confirmation email to submitter
    if (submitterProfile?.email) {
      console.log("Preparing submitter confirmation email");
      const submitterTemplate = {
        subject: `Submission Confirmed: ${existingForm.name}`,
        html: `
          <h2>Form Submission Confirmation</h2>
          <p>Hi ${submitterProfile.name},</p>
          <p>Your submission for "${existingForm.name}" has been received successfully.</p>
          <p>Thank you for your participation!</p>
          <p>If you need to reference this submission later, you can find it in your submissions history.</p>
          <br>
          <p>Best regards,</p>
          <p>The MeritMess Team</p>
        `,
      };

      try {
        console.log("Sending confirmation email to submitter...");
        await EmailService.sendEmail(submitterProfile.email, submitterTemplate);
        console.log("Submitter confirmation email sent successfully");

        // Add a small delay before sending the next email
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (emailError) {
        console.error("Failed to send confirmation email to submitter:", {
          error: emailError,
          errorMessage: (emailError as Error).message,
          errorStack: (emailError as Error).stack,
          recipientEmail: submitterProfile.email,
        });
      }
    } else {
      console.log("No email found for submitter - skipping confirmation email");
    }

    // Send notification email to form owner
    if (formOwnerProfile?.email) {
      console.log("Preparing form owner notification email");
      const ownerTemplate = {
        subject: `New Submission: ${existingForm.name}`,
        html: `
          <h2>New Form Submission Received</h2>
          <p>Hi ${formOwnerProfile.name},</p>
          <p>You have received a new submission for "${existingForm.name}".</p>
          <p>Submission details:</p>
          <ul>
            <li>Submitted by: ${submitterProfile?.name || "Anonymous"}</li>
            <li>Date: ${new Date().toLocaleString()}</li>
          </ul>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/forms/${
          existingForm.id
        }/submissions">View Submission</a>
          <br>
          <p>Best regards,</p>
          <p>The MeritMess Team</p>
        `,
      };

      try {
        console.log("Sending notification email to form owner...");
        await EmailService.sendEmail(formOwnerProfile.email, ownerTemplate);
        console.log("Form owner notification email sent successfully");
      } catch (emailError) {
        console.error("Failed to send notification email to form owner:", {
          error: emailError,
          errorMessage: (emailError as Error).message,
          errorStack: (emailError as Error).stack,
          recipientEmail: formOwnerProfile.email,
        });
      }
    } else {
      console.log(
        "No email found for form owner - skipping notification email"
      );
    }

    console.log("Form submission process completed successfully");
    return submission;
  } catch (error) {
    console.error("Error in form submission process:", {
      error,
      errorMessage: (error as Error).message,
      errorStack: (error as Error).stack,
    });
    throw error;
  }
}

export async function CheckDuplicateSubmission(
  formUrl: string,
  userId: string
) {
  const existingSubmission = await prisma.form.findFirst({
    where: {
      shareURL: formUrl,
      FormSubmissions: {
        some: {
          userId: userId,
        },
      },
    },
    include: {
      FormSubmissions: {
        where: {
          userId: userId,
        },
        select: {
          createdAt: true,
        },
      },
    },
  });

  if (existingSubmission && existingSubmission.FormSubmissions.length > 0) {
    return {
      hasDuplicate: true,
      submissionDate: existingSubmission.FormSubmissions[0].createdAt,
    };
  }

  return {
    hasDuplicate: false,
    submissionDate: null,
  };
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

export async function getPublicForms() {
  "use server";
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
    },
  });
  return forms;
}

export async function UpdateFormStatus(id: number, status: string) {
  const session = await getSession();
  const user = session?.user;

  if (!user || !user.sub) {
    throw new UserNotFoundErr();
  }

  const form = await prisma.form.update({
    where: {
      userId: user.sub,
      id,
    },
    data: {
      status,
    },
  });

  // Send email notification
  const userProfile = await prisma.profile.findUnique({
    where: { userId: user.sub },
  });

  if (userProfile) {
    await EmailService.sendFormStatusUpdateNotification(
      userProfile,
      form.name,
      status
    );
  }

  return form;
}

export async function getPublicFormsWithOwners(): Promise<FormWithOwner[]> {
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

  // Fetch all unique user IDs from the forms
  const userIds = [...new Set(forms.map((form) => form.userId))];

  // Fetch all profiles for these users in one query
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

  // Create a map of userId to profile for efficient lookup
  const profileMap = new Map(
    profiles.map((profile) => [profile.userId, profile])
  );

  // Combine form data with owner information
  const formsWithOwners = forms.map((form) => ({
    ...form,
    owner: profileMap.get(form.userId) || null,
    createdAt: form.createdAt.toISOString(), // Convert Date to string for serialization
  }));

  return formsWithOwners;
}
