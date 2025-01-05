import { Resend } from "resend";
import { Profile, ProjectGroup, Task, MentorshipRequest } from "@prisma/client";

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates interface
interface EmailTemplate {
  subject: string;
  html: string;
}

export class EmailService {
  private static FROM_EMAIL = "onboarding@resend.dev";

  // Helper method to send emails
  private static async sendEmail(
    to: string,
    template: { subject: string; html: string }
  ) {
    try {
      console.log("Attempting to send email to:", to);
      console.log(
        "Using RESEND_API_KEY:",
        process.env.RESEND_API_KEY ? "Present" : "Missing"
      );

      const data = await resend.emails.send({
        from: this.FROM_EMAIL,
        to,
        subject: template.subject,
        html: template.html,
      });

      console.log("Email sent successfully:", data);
      return data;
    } catch (error) {
      console.error("Detailed email sending error:", error);
      throw error;
    }
  }

  // Welcome email when user creates account
  static async sendWelcomeEmail(user: Profile) {
    const template = {
      subject: "Welcome to MeritMess! 🚀",
      html: `
        <h1>Welcome to MeritMess, ${user.name}!</h1>
        <p>We're excited to have you join our community of innovators and creators.</p>
        <p>Here's what you can do next:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Browse project ideas</li>
          <li>Connect with mentors</li>
          <li>Join or create a team</li>
        </ul>
      `,
    };
    await this.sendEmail(user.email!, template);
  }

  static async sendProfileUpdateNotification(profile: Profile) {
    if (!profile.email) {
      console.error("Profile email is missing");
      throw new Error("Profile email is required for sending notifications");
    }

    console.log("Preparing to send profile update email to:", profile.email);

    const template = {
      subject: "Your MeritMess Profile Has Been Updated",
      html: `
        <h2>Profile Update Confirmation</h2>
        <p>Hi ${profile.name},</p>
        <p>Your MeritMess profile has been successfully updated.</p>
        
        <h3>Updated Profile Details:</h3>
        <ul>
          <li>Name: ${profile.name}</li>
          <li>Profile Type: ${profile.type}</li>
          ${profile.bio ? `<li>Bio: ${profile.bio}</li>` : ""}
          <li>Skills: ${
            Array.isArray(profile.skills) ? profile.skills.join(", ") : ""
          }</li>
          ${
            profile.organization
              ? `<li>Organization: ${profile.organization}</li>`
              : ""
          }
        </ul>
        
        ${
          profile.type === "mentor"
            ? `
        <h3>Mentor Details:</h3>
        <ul>
          <li>Available for Mentorship: ${
            profile.availableForMentorship ? "Yes" : "No"
          }</li>
          ${
            profile.yearsOfExperience
              ? `<li>Years of Experience: ${profile.yearsOfExperience}</li>`
              : ""
          }
          ${
            Array.isArray(profile.mentorExpertise) &&
            profile.mentorExpertise.length
              ? `<li>Areas of Expertise: ${profile.mentorExpertise.join(
                  ", "
                )}</li>`
              : ""
          }
          ${
            Array.isArray(profile.certifications) &&
            profile.certifications.length
              ? `<li>Certifications: ${profile.certifications.join(", ")}</li>`
              : ""
          }
        </ul>
        `
            : ""
        }
        
        <p>You can view your updated profile here:</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile">View Profile</a>
      `,
    };

    try {
      await this.sendEmail(profile.email, template);
    } catch (error) {
      console.error("Failed to send profile update email:", error);
      throw error;
    }
  }

  // Project team invitation
  static async sendTeamInvitation(invitee: Profile, group: ProjectGroup) {
    const template = {
      subject: `You've Been Invited to Join ${group.name}`,
      html: `
        <h2>Team Invitation</h2>
        <p>You've been invited to join the project team: ${group.name}</p>
        <p>${group.description}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/groups/${group.uid}/join">View Invitation</a>
      `,
    };
    await this.sendEmail(invitee.email!, template);
  }

  // Mentor request notification
  static async sendMentorRequest(
    request: MentorshipRequest,
    mentor: Profile,
    group: ProjectGroup
  ) {
    const template = {
      subject: "New Mentorship Request",
      html: `
        <h2>New Mentorship Request</h2>
        <p>You've received a mentorship request for project: ${group.name}</p>
        <p>Message: ${request.message}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/mentor/requests">View Request</a>
      `,
    };
    await this.sendEmail(mentor.email!, template);
  }

  // Task assignment notification
  static async sendTaskAssignment(
    task: Task,
    assignee: Profile,
    group: ProjectGroup
  ) {
    const template = {
      subject: `New Task Assigned: ${task.title}`,
      html: `
        <h2>New Task Assignment</h2>
        <p>You've been assigned a new task in ${group.name}:</p>
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <p>Priority: ${task.priority}</p>
        <p>Due Date: ${task.dueDate?.toLocaleDateString()}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/groups/${group.uid}/tasks/${
        task.id
      }">View Task</a>
      `,
    };
    await this.sendEmail(assignee.email!, template);
  }

  // Meeting scheduled notification
  static async sendMeetingNotification(
    attendee: Profile,
    meeting: {
      title: string;
      description: string;
      scheduledFor: Date;
      meetLink?: string;
    },
    group: ProjectGroup
  ) {
    const template = {
      subject: `Meeting Scheduled: ${meeting.title}`,
      html: `
        <h2>New Meeting Scheduled</h2>
        <p>A new meeting has been scheduled for ${group.name}:</p>
        <h3>${meeting.title}</h3>
        <p>${meeting.description}</p>
        <p>Date & Time: ${meeting.scheduledFor.toLocaleString()}</p>
        ${meeting.meetLink ? `<p>Meeting Link: ${meeting.meetLink}</p>` : ""}
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/groups/${
        group.uid
      }/meetings">View Details</a>
      `,
    };
    await this.sendEmail(attendee.email!, template);
  }

  // Project status update
  static async sendProjectUpdate(
    member: Profile,
    group: ProjectGroup,
    update: string
  ) {
    const template = {
      subject: `Project Update: ${group.name}`,
      html: `
        <h2>Project Status Update</h2>
        <p>There's been an update to your project ${group.name}:</p>
        <p>${update}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/groups/${group.uid}">View Project</a>
      `,
    };
    await this.sendEmail(member.email!, template);
  }

  static async sendFormCreationNotification(
    user: Profile,
    formName: string,
    formId: number
  ) {
    const template = {
      subject: `Form Created: ${formName}`,
      html: `
        <h2>New Form Created</h2>
        <p>Hi ${user.name},</p>
        <p>Your form "${formName}" has been created successfully.</p>
        <p>You can now:</p>
        <ul>
          <li>Add content to your form</li>
          <li>Customize form settings</li>
          <li>Preview your form</li>
          <li>Publish when ready</li>
        </ul>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/forms/${formId}">View Form</a>
      `,
    };
    await this.sendEmail(user.email!, template);
  }

  // Form content update notification
  static async sendFormContentUpdateNotification(
    user: Profile,
    formName: string,
    formId: number
  ) {
    const template = {
      subject: `Form Updated: ${formName}`,
      html: `
        <h2>Form Content Updated</h2>
        <p>Hi ${user.name},</p>
        <p>The content of your form "${formName}" has been updated successfully.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/forms/${formId}">View Updated Form</a>
      `,
    };
    await this.sendEmail(user.email!, template);
  }

  // Form published notification
  static async sendFormPublishedNotification(
    user: Profile,
    formName: string,
    shareURL: string
  ) {
    const template = {
      subject: `Form Published: ${formName}`,
      html: `
        <h2>Form Published Successfully</h2>
        <p>Hi ${user.name},</p>
        <p>Your form "${formName}" is now live and accepting submissions!</p>
        <p>Share this link with your participants:</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/forms/${shareURL}">${process.env.NEXT_PUBLIC_APP_URL}/forms/${shareURL}</a></p>
      `,
    };
    await this.sendEmail(user.email!, template);
  }

  // Form submission notification
  static async sendFormSubmissionNotification(
    formOwner: Profile,
    formName: string,
    formId: number
  ) {
    const template = {
      subject: `New Submission: ${formName}`,
      html: `
        <h2>New Form Submission Received</h2>
        <p>Hi ${formOwner.name},</p>
        <p>You have received a new submission for "${formName}".</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/forms/${formId}/submissions">View Submissions</a>
      `,
    };
    await this.sendEmail(formOwner.email!, template);
  }

  // Form status update notification
  static async sendFormStatusUpdateNotification(
    user: Profile,
    formName: string,
    status: string
  ) {
    const template = {
      subject: `Form Status Updated: ${formName}`,
      html: `
        <h2>Form Status Change</h2>
        <p>Hi ${user.name},</p>
        <p>The status of your form "${formName}" has been updated to: ${status}</p>
        <p>This means:</p>
        <ul>
          ${
            status === "closed"
              ? "<li>The form is no longer accepting new submissions</li>"
              : "<li>The form is open and can receive submissions</li>"
          }
        </ul>
      `,
    };
    await this.sendEmail(user.email!, template);
  }
}
