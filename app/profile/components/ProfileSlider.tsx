"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Github,
  Linkedin,
  Mail,
  MapPin,
  Building,
  Plus,
  X,
  Loader2,
  Check,
  Edit3,
  ExternalLink,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import isEqual from "lodash/isEqual";
import ImageUpload from './ImageUpload';


interface Project {
  name: string;
  description: string;
  status: "planning" | "in-progress" | "completed";
}

interface Profile {
  name: string;
  imageUrl?: string;
  type: string;
  email: string;
  location?: string;
  organization?: string;
  github?: string;
  linkedin?: string;
  bio?: string;
  skills: string[];
  ongoing_projects: Project[];
}

interface ProfileSliderProps {
  profile: Profile;
  onSave: (data: Profile) => Promise<void>;
}

const statusColors = {
  planning: "bg-yellow-100 text-yellow-800",
  "in-progress": "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
};

const LoadingProfile = () => (
  <div className="space-y-6 p-6 max-w-6xl mx-auto">
    <div className="text-center space-y-4">
      <Skeleton className="h-32 w-32 rounded-full mx-auto" />
      <Skeleton className="h-12 w-1/3 mx-auto" />
      <Skeleton className="h-6 w-1/4 mx-auto" />
    </div>
    <div className="grid md:grid-cols-12 gap-6">
      <div className="md:col-span-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-5/6" />
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-8 space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-1/4 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

const ProfileSlider: React.FC<ProfileSliderProps> = ({ profile, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Profile>(profile);
  const [newSkill, setNewSkill] = useState("");
  const [newProject, setNewProject] = useState<Project>({
    name: "",
    description: "",
    status: "planning",
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const hasChanges = !isEqual(profile, formData);

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
  
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
  
      const { imageUrl } = await response.json();
      
      // Update local state
      setFormData(prev => ({ ...prev, imageUrl }));
      
      // Immediately save to database
      await onSave({ ...formData, imageUrl });
  
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const addProject = () => {
    if (newProject.name.trim() && newProject.description.trim()) {
      setFormData((prev) => ({
        ...prev,
        ongoing_projects: [...prev.ongoing_projects, { ...newProject }],
      }));
      setNewProject({
        name: "",
        description: "",
        status: "planning",
      });
    }
  };

  const removeProject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ongoing_projects: prev.ongoing_projects.filter((_, idx) => idx !== index),
    }));
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      setIsSaving(true);
      await onSave(formData);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        duration: 3000,
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={isEditing ? "edit" : "view"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="max-w-6xl mx-auto"
        >
          {/* Profile Header */}
          <ImageUpload
              onUpload={handleImageUpload}
              imageUrl={formData.imageUrl}
            />
          <motion.div
            className="text-center mb-8"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
          >
            <h1 className="text-4xl font-bold mb-2">{profile.name}</h1>
            <Badge variant="secondary" className="text-lg px-6 py-1">
              {profile.type}
            </Badge>
          </motion.div>

          {!isEditing ? (
            // View Mode
            <div className="grid md:grid-cols-12 gap-6">
              {/* Sidebar */}
              <motion.div
                className="md:col-span-4"
                initial={{ x: -20 }}
                animate={{ x: 0 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <span>{profile.email}</span>
                      </div>
                      {profile.location && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-primary" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      {profile.organization && (
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5 text-primary" />
                          <span>{profile.organization}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-6 border-t">
                      {profile.github && (
                        <a
                          href={`https://github.com/${profile.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors"
                        >
                          <Github className="h-5 w-5" />
                          <span>{profile.github}</span>
                          <ExternalLink className="h-4 w-4 ml-auto opacity-50" />
                        </a>
                      )}
                      {profile.linkedin && (
                        <a
                          href={`https://linkedin.com/in/${profile.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors"
                        >
                          <Linkedin className="h-5 w-5" />
                          <span>{profile.linkedin}</span>
                          <ExternalLink className="h-4 w-4 ml-auto opacity-50" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Main Content */}
              <motion.div
                className="md:col-span-8 space-y-6"
                initial={{ x: 20 }}
                animate={{ x: 0 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>About</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 className="h-5 w-5" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed">
                      {profile.bio || "No bio added yet"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <motion.div
                          key={skill}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                        >
                          <Badge variant="secondary" className="px-3 py-1">
                            {skill}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {profile.ongoing_projects.map((project, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <h4 className="font-semibold text-lg mb-2">
                                    {project.name}
                                  </h4>
                                  <p className="text-muted-foreground">
                                    {project.description}
                                  </p>
                                </div>
                                <Badge variant="secondary" className="shrink-0">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {project.status}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          ) : (
            // Edit Mode
            <Card>
              <CardContent className="p-6 relative">
                <div className="absolute right-4 top-4">
                  <Button
                    onClick={handleSave}
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
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Name
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="mb-4"
                      />

                      <label className="text-sm font-medium mb-1 block">
                        Type
                      </label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, type: value }))
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

                      <label className="text-sm font-medium mb-1 block">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="mb-4"
                      />

                      <label className="text-sm font-medium mb-1 block">
                        Location
                      </label>
                      <Input
                        value={formData.location || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        className="mb-4"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Organization
                      </label>
                      <Input
                        value={formData.organization || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            organization: e.target.value,
                          }))
                        }
                        className="mb-4"
                      />

                      <label className="text-sm font-medium mb-1 block">
                        GitHub Username
                      </label>
                      <Input
                        value={formData.github || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            github: e.target.value,
                          }))
                        }
                        className="mb-4"
                      />

                      <label className="text-sm font-medium mb-1 block">
                        LinkedIn Username
                      </label>
                      <Input
                        value={formData.linkedin || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            linkedin: e.target.value,
                          }))
                        }
                        className="mb-4"
                      />

                      <label className="text-sm font-medium mb-1 block">
                        Bio
                      </label>
                      <Textarea
                        value={formData.bio || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            bio: e.target.value,
                          }))
                        }
                        rows={4}
                        className="mb-4"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Skills
                    </label>
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
                              <SelectItem value="in-progress">
                                In Progress
                              </SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
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
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ProfileSlider;
