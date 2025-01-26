import { z } from "zod";

// Base Project Schema
const ProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.enum(["planning", "in-progress", "completed"]),
});

// Mentor Details Schema (moved before usage)
const MentorDetailsSchema = z.object({
  expertise: z.array(z.string()).optional(),
  yearsOfExperience: z
    .number()
    .int()
    .min(0, "Years of experience must be non-negative")
    .optional(),
  availableForMentorship: z.boolean().optional(),
  mentoredProjects: z.array(ProjectSchema).optional(),
  mentorRating: z.number().min(0).max(5).optional(),
  certifications: z.array(z.string()).optional(),
});

// Profile Schema
const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  imageUrl: z.string().optional(),
  type: z.enum(["student", "mentor"], { 
    required_error: "Type is required",
    invalid_type_error: "Type must be either student or mentor",
  }),
  email: z.string().email("Invalid email address"),
  location: z.string().optional(),
  organization: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()),
  ongoing_projects: z.array(ProjectSchema),
  achievements: z.array(z.string()).default([]),

  // Conditional mentor fields
  mentorDetails: z.optional(
    MentorDetailsSchema.refine(
      (data) =>
        data.type === "mentor"
          ? data.expertise && data.expertise.length > 0
          : true,
      { message: "Mentors must specify at least one area of expertise" }
    )
  ),
});

// Profile Update Schema
const profileUpdateSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(["student", "mentor"], {
      required_error: "Type is required",
    }),
    imageUrl: z.string().optional(),
    email: z.string().email("Invalid email address"),
    location: z.string().optional(),
    organization: z.string().optional(),
    github: z.string().optional(),
    linkedin: z.string().optional(),
    bio: z.string().optional(),
    skills: z.array(z.string()).optional(),
    ongoing_projects: z.array(ProjectSchema).optional(),
    mentorDetails: z.optional(MentorDetailsSchema),
  })
  .refine(
    (data) =>
      data.type !== "mentor" ||
      (data.mentorDetails?.expertise &&
        data.mentorDetails.expertise.length > 0),
    { message: "Mentors must specify at least one area of expertise" }
  );

// Type Exports
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type MentorDetails = z.infer<typeof MentorDetailsSchema>;

export {
  ProjectSchema,
  MentorDetailsSchema,
  profileSchema,
  profileUpdateSchema,
};
