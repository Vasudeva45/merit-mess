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

export async function updateProfile(formData) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user || !user.sub) {
      throw new Error("User not found");
    }

    // Log the incoming form data for debugging
    console.log("Received form data:", formData);

    // Ensure email is properly formatted before validation
    const sanitizedFormData = {
      ...formData,
      email: formData.email?.trim() || user.email, // Use auth0 email as fallback
    };

    // Validate the data
    const validation = profileUpdateSchema.safeParse(sanitizedFormData);

    if (!validation.success) {
      console.error(
        "Validation errors:",
        validation.error.flatten().fieldErrors
      );
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
      skills: Array.isArray(skills)
        ? skills
        : (skills || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
      ongoing_projects: Array.isArray(ongoing_projects) ? ongoing_projects : [],
      mentorExpertise:
        type === "mentor" && mentorDetails?.expertise
          ? Array.isArray(mentorDetails.expertise)
            ? mentorDetails.expertise
            : mentorDetails.expertise
                .split(",")
                .map((e) => e.trim())
                .filter(Boolean)
          : [],
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
        type === "mentor" && mentorDetails?.certifications
          ? Array.isArray(mentorDetails.certifications)
            ? mentorDetails.certifications
            : mentorDetails.certifications
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean)
          : [],
    };

    console.log("Processed update data:", updateData);

    // Update the profile
    const updatedProfile = await prisma.profile.upsert({
      where: { userId: user.sub },
      update: updateData,
      create: {
        userId: user.sub,
        ...updateData,
      },
    });

    console.log("Profile updated successfully:", updatedProfile);

    // Send email notification
    try {
      await EmailService.sendProfileUpdateNotification(updatedProfile);
      console.log("Email notification sent successfully");
    } catch (emailError) {
      console.error("Email notification error:", emailError);
      // Don't throw here - email notification failure shouldn't block profile update
    }

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

export async function getCurrentUserProfile() {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user || !user.sub) {
      throw new UserNotFoundErr();
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.sub },
      select: {
        type: true, // Only select the type field to minimize data retrieval
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
