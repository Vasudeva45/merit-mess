"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EditMentorDetails } from "./EditMentorDetails";
import { Profile, Project } from "./types";

const GithubVerificationModal = ({
  isOpen,
  onClose,
  onSuccess,
  pendingProfile,
}) => {
  const [githubUsername, setGithubUsername] = useState("");
  const [verificationStep, setVerificationStep] = useState("initial");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [verificationCode, setVerificationCode] = useState(null);

  const initiateVerification = async () => {
    try {
      setIsVerifying(true);
      setError(null);

      const response = await fetch("/api/verification/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUsername,
          action: "initiate",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to initiate verification");
      }

      setVerificationCode(result.verificationCode);
      setVerificationStep("verifying");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const completeVerification = async () => {
    try {
      setIsVerifying(true);
      setError(null);

      const response = await fetch("/api/verification/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUsername,
          profileData: pendingProfile,
          action: "verify",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Verification failed");
      }

      if (result.verified) {
        onSuccess(result);
      } else {
        throw new Error("Verification requirements not met");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            GitHub Verification Required
          </h2>
          {verificationStep === "initial" ? (
            <>
              <Input
                placeholder="Enter your GitHub username"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
              />
              <Button
                onClick={initiateVerification}
                disabled={isVerifying || !githubUsername}
                className="w-full"
              >
                {isVerifying ? "Checking..." : "Start Verification"}
              </Button>
            </>
          ) : (
            <>
              <div className="bg-secondary p-4 rounded-md">
                <p className="font-medium">Verification Code:</p>
                <p className="text-lg font-mono mt-2">{verificationCode}</p>
              </div>
              <div className="space-y-2">
                <p>Please complete ONE of the following:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Create a public repository named
                    &apos;verification-repo&apos; with this code
                  </li>
                  <li>Create a public gist containing this code</li>
                  <li>Add this code to your GitHub bio</li>
                </ul>
              </div>
              <Button
                onClick={completeVerification}
                disabled={isVerifying}
                className="w-full"
              >
                {isVerifying ? "Verifying..." : "Complete Verification"}
              </Button>
            </>
          )}
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface EditProfileProps {
  formData: Profile;
  setFormData: (data: Profile) => void;
  isSaving: boolean;
  hasChanges: boolean;
  onSave: () => Promise<void>;
}

export const EditProfile: React.FC<EditProfileProps> = ({
  formData,
  setFormData,
  isSaving,
  hasChanges,
  onSave,
}) => {
  const [showGithubVerification, setShowGithubVerification] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newProject, setNewProject] = useState<Project>({
    name: "",
    description: "",
    status: "planning",
  });

  const handleTypeChange = (value: "student" | "mentor") => {
    if (value === "mentor") {
      setShowGithubVerification(true);
    } else {
      setFormData({
        ...formData,
        type: value,
        mentorDetails: undefined,
      });
    }
  };

  const handleGithubVerificationSuccess = (result) => {
    setShowGithubVerification(false);
    setFormData({
      ...formData,
      type: "mentor",
      mentorDetails: {
        expertise: [],
        yearsOfExperience: undefined,
        availableForMentorship: true,
        certifications: [],
      },
      githubUsername: result.githubUsername,
      githubVerified: true,
    });
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  const addProject = () => {
    if (newProject.name.trim() && newProject.description.trim()) {
      setFormData({
        ...formData,
        ongoing_projects: [...formData.ongoing_projects, { ...newProject }],
      });
      setNewProject({
        name: "",
        description: "",
        status: "planning",
      });
    }
  };

  const removeProject = (index: number) => {
    setFormData({
      ...formData,
      ongoing_projects: formData.ongoing_projects.filter(
        (_, idx) => idx !== index
      ),
    });
  };

  // Check if type is already set (not empty string or undefined)
  const isTypeSet = Boolean(formData.type);

  return (
    <>
      <Card>
        <CardContent className="p-6 relative">
          <div className="absolute right-4 top-4">
            <Button
              onClick={onSave}
              disabled={isSaving || !hasChanges}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          <div className="space-y-6 mt-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mb-4"
                />

                <label className="text-sm font-medium mb-1 block">Type</label>
                <Select
                  value={formData.type}
                  onValueChange={handleTypeChange}
                  disabled={isTypeSet}
                >
                  <SelectTrigger className="mb-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                {/* Contact and Social Media */}
                <label className="text-sm font-medium mb-1 block">Bio</label>
                <Textarea
                  value={formData.bio || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={4}
                  className="mb-4"
                />
              </div>
            </div>

            {/* Skills Section */}
            <div>
              <label className="text-sm font-medium mb-1 block">Skills</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button onClick={addSkill} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="gap-1 px-3 py-1"
                  >
                    {skill}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeSkill(skill)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Projects Section */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Add New Project
              </label>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <Input
                      placeholder="Project name"
                      value={newProject.name}
                      onChange={(e) =>
                        setNewProject((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                    <Textarea
                      placeholder="Project description"
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                    <Select
                      value={newProject.status}
                      onValueChange={(
                        value: "planning" | "in-progress" | "completed"
                      ) =>
                        setNewProject((prev) => ({
                          ...prev,
                          status: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addProject} className="w-full">
                      Add Project
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6 space-y-4">
                <h4 className="font-medium">Current Projects</h4>
                {formData.ongoing_projects.map((project, idx) => (
                  <Card key={idx} className="p-4 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 hover:bg-red-100 hover:text-red-600"
                      onClick={() => removeProject(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="pr-8">
                      <h5 className="font-medium mb-2">{project.name}</h5>
                      <p className="text-sm text-gray-600 mb-2">
                        {project.description}
                      </p>
                      <Badge variant="secondary">{project.status}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Render Mentor Details if type is mentor */}
      {formData.type === "mentor" && (
        <EditMentorDetails formData={formData} setFormData={setFormData} />
      )}

      <GithubVerificationModal
        isOpen={showGithubVerification}
        onClose={() => {
          setShowGithubVerification(false);
          setFormData({
            ...formData,
            type: "student",
          });
        }}
        onSuccess={handleGithubVerificationSuccess}
        pendingProfile={formData}
      />
    </>
  );
};
