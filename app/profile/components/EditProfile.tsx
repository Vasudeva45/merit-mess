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
import { Profile, Project } from "./types";
import { EditMentorDetails } from "./EditMentorDetails";

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
  const [newSkill, setNewSkill] = useState("");
  const [newProject, setNewProject] = useState<Project>({
    name: "",
    description: "",
    status: "planning",
  });

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
                  onValueChange={(value: "student" | "mentor") =>
                    setFormData({
                      ...formData,
                      type: value,
                      mentorDetails:
                        value === "mentor"
                          ? {
                              expertise: [],
                              yearsOfExperience: undefined,
                              availableForMentorship: false,
                              certifications: [],
                            }
                          : undefined,
                    })
                  }
                >
                  <SelectTrigger className="mb-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                  </SelectContent>
                </Select>

                {/* Additional fields... */}
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
    </>
  );
};
