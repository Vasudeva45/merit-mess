"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@auth0/nextjs-auth0";
import { revalidatePath } from "next/cache";
import {
  profileSchema,
  profileUpdateSchema,
  type ProfileFormData,
  type ProfileUpdateData,
} from "@/schemas/profile";

class UserNotFoundErr extends Error {}
class ValidationError extends Error {
  constructor(public errors: Record<string, string[]>) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

export async function getProfile() {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user || !user.sub) {
      throw new UserNotFoundErr();
    }

    const profile = await prisma.profile.findUnique({
      where: {
        userId: user.sub,
      },
    });

    if (!profile) {
      const defaultProfile: ProfileFormData = {
        name: user.name || "",
        imageUrl: "", // Ensure this is included
        type: "student",
        email: user.email || "",
        skills: [],
        achievements: [],
        ongoing_projects: [],
      };

      const validation = profileSchema.safeParse(defaultProfile);

      if (!validation.success) {
        throw new ValidationError(validation.error.flatten().fieldErrors);
      }

      const newProfile = await prisma.profile.create({
        data: {
          userId: user.sub,
          ...defaultProfile,
        },
      });

      revalidatePath("/profile");
      return newProfile;
    }

    return profile;
  } catch (error) {
    if (error instanceof UserNotFoundErr) {
      throw error;
    }
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error("Error fetching profile:", error);
    throw new Error("Failed to fetch profile");
  }
}

export async function updateProfile(formData: ProfileUpdateData) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user || !user.sub) {
      throw new UserNotFoundErr();
    }

    const validation = profileUpdateSchema.safeParse(formData);

    if (!validation.success) {
      throw new ValidationError(validation.error.flatten().fieldErrors);
    }

    const updatedProfile = await prisma.profile.upsert({
      where: {
        userId: user.sub,
      },
      update: {
        ...validation.data,
        ongoing_projects: validation.data.ongoing_projects as any,
      },
      create: {
        userId: user.sub,
        ...validation.data,
        ongoing_projects: validation.data.ongoing_projects as any,
      },
    });

    revalidatePath("/profile");
    return { success: true, data: updatedProfile };
  } catch (error) {
    if (error instanceof UserNotFoundErr) {
      return { success: false, error: "User not found" };
    }
    if (error instanceof ValidationError) {
      return { success: false, error: formatValidationErrors(error) };
    }
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function getProfilesByIds(userIds: string[]) {
  try {
    const profiles = await prisma.profile.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });

    return profiles;
  } catch (error) {
    console.error("Error fetching profiles:", error);
    throw new Error("Failed to fetch profiles");
  }
}

export async function formatValidationErrors(error: ValidationError) {
  return Object.entries(error.errors).reduce((acc, [field, messages]) => {
    acc[field] = messages.join(", ");
    return acc;
  }, {} as Record<string, string>);
}
