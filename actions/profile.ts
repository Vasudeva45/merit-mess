"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@auth0/nextjs-auth0";
import { revalidatePath } from "next/cache";
import {
  profileSchema,
  profileUpdateSchema,
  type ProfileFormData,
  type ProfileUpdateData,
  type MentorDetails,
} from "@/schemas/profile";
import { EmailService } from "@/actions/emailService";
import { cache } from "react";

// Custom error classes
class UserNotFoundErr extends Error {}
class ValidationError extends Error {
  constructor(public errors: Record<string, string[]>) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

// Cached authentication
const getAuthenticatedUser = cache(async () => {
  const session = await getSession();
  const user = session?.user;

  if (!user || !user.sub) {
    throw new UserNotFoundErr();
  }

  return user;
});

// Helper to process arrays from form inputs
const processArrayField = (field: string | string[] | undefined): string[] => {
  if (Array.isArray(field)) return field;
  if (!field) return [];
  return field
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

// Cached profile retrieval
const getUserProfile = cache(async (userId: string) => {
  return prisma.profile.findUnique({
    where: { userId },
  });
});

export async function getProfile() {
  try {
    const user = await getAuthenticatedUser();
    const profile = await getUserProfile(user.sub);

    if (!profile) {
      const defaultProfile: ProfileFormData = {
        name: user.name || "",
        imageUrl: "",
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
          mentorExpertise: [],
          mentoredProjects: [],
          certifications: [],
        },
      });

      revalidatePath("/profile");
      return newProfile;
    }

    return profile;
  } catch (error) {
    if (error instanceof UserNotFoundErr || error instanceof ValidationError) {
      throw error;
    }
    console.error("Error fetching profile:", error);
    throw new Error("Failed to fetch profile");
  }
}

export async function updateProfile(formData) {
  try {
    const user = await getAuthenticatedUser();

    // Ensure email is properly formatted before validation
    const sanitizedFormData = {
      ...formData,
      email: formData.email?.trim() || user.email, // Use auth0 email as fallback
    };

    // Validate the data
    const validation = profileUpdateSchema.safeParse(sanitizedFormData);

    if (!validation.success) {
      throw new ValidationError(validation.error.flatten().fieldErrors);
    }

    // Separate mentor-specific fields
    const {
      mentorDetails,
      type,
      ongoing_projects,
      skills,
      ...otherProfileData
    } = validation.data;

    // Prepare update data with proper type checking
    const updateData = {
      ...otherProfileData,
      type,
      skills: processArrayField(skills),
      ongoing_projects: Array.isArray(ongoing_projects) ? ongoing_projects : [],
      mentorExpertise:
        type === "mentor" ? processArrayField(mentorDetails?.expertise) : [],
      yearsOfExperience:
        type === "mentor"
          ? typeof mentorDetails?.yearsOfExperience === "number"
            ? mentorDetails.yearsOfExperience
            : parseInt(mentorDetails?.yearsOfExperience || "0")
          : null,
      availableForMentorship:
        type === "mentor"
          ? Boolean(mentorDetails?.availableForMentorship)
          : false,
      certifications:
        type === "mentor"
          ? processArrayField(mentorDetails?.certifications)
          : [],
    };

    // Update the profile
    const updatedProfile = await prisma.profile.upsert({
      where: { userId: user.sub },
      update: updateData,
      create: {
        userId: user.sub,
        ...updateData,
      },
    });

    // Send email notification asynchronously
    EmailService.sendProfileUpdateNotification(updatedProfile).catch(
      (emailError) => {
        console.error("Email notification error:", emailError);
      }
    );

    revalidatePath("/profile");
    return { success: true, data: updatedProfile };
  } catch (error) {
    console.error("Profile update error:", error);

    if (error instanceof ValidationError) {
      // Return validation errors in a structured way
      throw new Error(JSON.stringify(error.errors));
    }

    throw new Error(`Failed to update profile: ${error.message}`);
  }
}

export async function getProfilesByIds(userIds: string[]) {
  try {
    // If empty array, return early
    if (!userIds.length) return [];

    return prisma.profile.findMany({
      where: {
        userId: { in: userIds },
      },
    });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    throw new Error("Failed to fetch profiles");
  }
}

export async function getPublicProfile(userId: string) {
  try {
    // Optimized query that selects only needed fields
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        submissions: {
          select: {
            createdAt: true,
            form: {
              select: {
                name: true,
                domain: true,
                specialization: true,
              },
            },
          },
        },
        groupMembers: {
          include: {
            group: {
              select: {
                name: true,
                description: true,
                status: true,
              },
            },
          },
        },
        assignedTasks: {
          where: { status: "completed" },
          select: {
            title: true,
            description: true,
            group: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!profile) return null;

    // Ensure arrays are initialized
    return {
      ...profile,
      skills: profile.skills || [],
      achievements: profile.achievements || [],
      ongoing_projects: profile.ongoing_projects || [],
    };
  } catch (error) {
    console.error("Error in getPublicProfile:", error);
    throw error;
  }
}

export async function getCurrentUserProfile() {
  try {
    const user = await getAuthenticatedUser();

    // Optimized query with minimal select
    const profile = await prisma.profile.findUnique({
      where: { userId: user.sub },
      select: {
        type: true,
        userId: true,
      },
    });

    if (!profile) {
      // If no profile exists, return a default profile type
      return { type: "student", userId: user.sub };
    }

    return profile;
  } catch (error) {
    console.error("Error fetching current user profile:", error);
    throw new Error("Failed to fetch current user profile");
  }
}

export async function formatValidationErrors(error: ValidationError) {
  return Object.entries(error.errors).reduce((acc, [field, messages]) => {
    acc[field] = messages.join(", ");
    return acc;
  }, {} as Record<string, string>);
}
