export interface Project {
    name: string;
    description: string;
    status: "planning" | "in-progress" | "completed";
  }
  
  export interface MentorDetails {
    expertise?: string[];
    yearsOfExperience?: number;
    availableForMentorship?: boolean;
    mentoredProjects?: Project[];
    mentorRating?: number;
    certifications?: string[];
  }
  
  export interface Profile {
    name: string;
    imageUrl?: string;
    type: "student" | "mentor";
    email: string;
    location?: string;
    organization?: string;
    github?: string;
    linkedin?: string;
    bio?: string;
    skills: string[];
    ongoing_projects: Project[];
    mentorDetails?: MentorDetails;
    mentorExpertise?: string[];
    yearsOfExperience?: number;
    availableForMentorship?: boolean;
    certifications?: string[];
    mentorRating?: number;
  }