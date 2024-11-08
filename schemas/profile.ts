import { z } from "zod";

const ProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.enum(["planning", "in-progress", "completed"]),
});

export const profileSchema = z.object({
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
});

export const profileUpdateSchema = profileSchema.partial().extend({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["student", "mentor"], {
    required_error: "Type is required",
  }),
  email: z.string().email("Invalid email address"),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type Project = z.infer<typeof ProjectSchema>;