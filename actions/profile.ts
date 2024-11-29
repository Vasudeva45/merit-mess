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
        imageUrl: "",
        type: "student",
        email: user.email || "",
        skills: [],
        achievements: [],
        ongoing_projects: [],
        // Optional mentor details can be omitted for default student profile
      };

      const validation = profileSchema.safeParse(defaultProfile);

      if (!validation.success) {
        throw new ValidationError(validation.error.flatten().fieldErrors);
      }

      const newProfile = await prisma.profile.create({
        data: {
          userId: user.sub,
          ...defaultProfile,
          mentorExpertise: [], // Ensure these match Prisma schema
          mentoredProjects: [],
          certifications: [],
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

export async function updateProfile(
  formData: z.infer<typeof profileUpdateSchema>
) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user || !user.sub) {
      throw new Error("User not found");
    }

    const validation = profileUpdateSchema.safeParse(formData);

    if (!validation.success) {
      throw new Error(JSON.stringify(validation.error.flatten().fieldErrors));
    }

    // Separate mentor-specific fields
    const {
      mentorDetails,
      type,
      ongoing_projects,
      skills,
      ...otherProfileData
    } = validation.data;

    const updateData = {
      ...otherProfileData,
      type,
      skills: skills || [],
      ongoing_projects: ongoing_projects as any,

      // Explicitly map mentor-specific fields
      mentorExpertise: type === "mentor" ? mentorDetails?.expertise || [] : [],
      yearsOfExperience:
        type === "mentor" ? mentorDetails?.yearsOfExperience : null,
      availableForMentorship:
        type === "mentor"
          ? mentorDetails?.availableForMentorship ?? false
          : false,
      certifications:
        type === "mentor" ? mentorDetails?.certifications || [] : [],
    };

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: user.sub },
      update: updateData,
      create: {
        userId: user.sub,
        ...updateData,
      },
    });

    console.log("Updated Profile:", JSON.stringify(updatedProfile, null, 2));
    revalidatePath("/profile");
    return { success: true, data: updatedProfile };
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
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

export async function getPublicProfile(userId: string) {
  try {
    // Add console.log to debug the userId being received
    console.log("Fetching profile for userId:", userId);

    const profile = await prisma.profile.findUnique({
      where: {
        userId: userId,
      },
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
          where: {
            status: "completed",
          },
          select: {
            title: true,
            description: true,
            group: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    console.log("Found profile:", profile ? "yes" : "no");

    if (!profile) {
      console.log("No profile found for userId:", userId);
      return null;
    }

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

export async function formatValidationErrors(error: ValidationError) {
  return Object.entries(error.errors).reduce((acc, [field, messages]) => {
    acc[field] = messages.join(", ");
    return acc;
  }, {} as Record<string, string>);
}
