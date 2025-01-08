// ProfileTypeModal.jsx
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { getProfile } from "@/actions/profile";
import ProfileStepOne from "./ProfileStepOne";
import ProfileStepTwo from "./ProfileStepTwo";

const PROJECT_STATUS = {
  PLANNING: "planning",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
} as const;

const ProfileTypeModal = ({ isOpen, onTypeSelect, user }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    type: "",
    name: "",
    email: "",
    skills: "",
    achievements: "",
    ongoing_projects: [
      { name: "", description: "", status: PROJECT_STATUS.PLANNING },
    ],
    mentorDetails: {
      expertise: "",
      yearsOfExperience: "",
      availableForMentorship: false,
      certifications: "",
    },
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const profile = await getProfile();
        if (profile) {
          setFormData({
            type: profile.type || "",
            name: profile.name || "",
            email: profile.email || user?.email || "",
            skills: Array.isArray(profile.skills)
              ? profile.skills.join(", ")
              : profile.skills || "",
            achievements: Array.isArray(profile.achievements)
              ? profile.achievements.join(", ")
              : profile.achievements || "",
            ongoing_projects:
              profile.ongoing_projects?.length > 0
                ? profile.ongoing_projects
                : [
                    {
                      name: "",
                      description: "",
                      status: PROJECT_STATUS.PLANNING,
                    },
                  ],
            mentorDetails: {
              expertise: Array.isArray(profile.mentorExpertise)
                ? profile.mentorExpertise.join(", ")
                : profile.mentorExpertise || "",
              yearsOfExperience: profile.yearsOfExperience || "",
              availableForMentorship: profile.availableForMentorship || false,
              certifications: Array.isArray(profile.certifications)
                ? profile.certifications.join(", ")
                : profile.certifications || "",
            },
          });

          if (profile.type) {
            setCurrentStep(2);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadProfileData();
    }
  }, [isOpen, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setError(null);
    if (name === "email") return;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleProjectChange = (index, field, value) => {
    setError(null);
    setFormData((prev) => ({
      ...prev,
      ongoing_projects: prev.ongoing_projects.map((project, i) =>
        i === index ? { ...project, [field]: value } : project
      ),
    }));
  };

  const addProject = () => {
    setFormData((prev) => ({
      ...prev,
      ongoing_projects: [
        ...prev.ongoing_projects,
        { name: "", description: "", status: PROJECT_STATUS.PLANNING },
      ],
    }));
  };

  const removeProject = (index) => {
    setFormData((prev) => ({
      ...prev,
      ongoing_projects: prev.ongoing_projects.filter((_, i) => i !== index),
    }));
  };

  const handleTypeSelect = (type) => {
    setError(null);
    setFormData((prev) => ({
      ...prev,
      type,
    }));
    setCurrentStep(2);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const formattedData = {
        ...formData,
        skills: formData.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        achievements: formData.achievements
          .split(",")
          .map((achievement) => achievement.trim())
          .filter(Boolean),
        ongoing_projects: formData.ongoing_projects.filter(
          (project) => project.name.trim() !== ""
        ),
        mentorDetails:
          formData.type === "mentor"
            ? {
                ...formData.mentorDetails,
                expertise: formData.mentorDetails.expertise
                  .split(",")
                  .map((exp) => exp.trim())
                  .filter(Boolean),
                certifications: formData.mentorDetails.certifications
                  .split(",")
                  .map((cert) => cert.trim())
                  .filter(Boolean),
                yearsOfExperience: parseInt(
                  formData.mentorDetails.yearsOfExperience
                ),
                availableForMentorship: true,
              }
            : undefined,
      };

      await onTypeSelect(formattedData);
      router.push("/profile?welcome=true");
    } catch (error) {
      console.error("Error submitting profile:", error);
      try {
        const errorData = JSON.parse(error.message);
        setError(errorData);
      } catch {
        setError({ general: [error.message] });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen}>
        <DialogContent>
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentStep === 1 ? (
            <ProfileStepOne
              formData={formData}
              error={error}
              handleTypeSelect={handleTypeSelect}
            />
          ) : (
            <ProfileStepTwo
              formData={formData}
              error={error}
              handleInputChange={handleInputChange}
              handleProjectChange={handleProjectChange}
              addProject={addProject}
              removeProject={removeProject}
              PROJECT_STATUS={PROJECT_STATUS}
            />
          )}
        </AnimatePresence>

        {currentStep === 2 && (
          <div className="flex justify-between pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              disabled={isSubmitting}
              className="transition-transform hover:-translate-x-1"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="transition-transform hover:translate-x-1"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                "Complete Profile"
              )}
            </Button>
          </div>
        )}

        {currentStep === 2 && (
          <p className="text-sm text-center text-muted-foreground mt-4">
            You'll be redirected to your profile page where you can add more
            details and customize your profile further.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileTypeModal;
