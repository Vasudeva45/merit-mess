import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ProjectForm = ({
  project,
  index,
  handleProjectChange,
  removeProject,
  PROJECT_STATUS,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-3 p-4 border rounded-lg bg-card"
  >
    <div className="flex justify-between items-center">
      <Label>Project {index + 1}</Label>
      {index > 0 && (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => removeProject(index)}
        >
          Remove
        </Button>
      )}
    </div>
    <Input
      value={project.name}
      onChange={(e) => handleProjectChange(index, "name", e.target.value)}
      placeholder="Project name"
      className="mb-2"
    />
    <Textarea
      value={project.description}
      onChange={(e) =>
        handleProjectChange(index, "description", e.target.value)
      }
      placeholder="Project description"
      className="mb-2"
    />
    <div className="space-y-2">
      <Label>Project Status</Label>
      <Select
        value={project.status}
        onValueChange={(value) => handleProjectChange(index, "status", value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={PROJECT_STATUS.PLANNING}>Planning</SelectItem>
          <SelectItem value={PROJECT_STATUS.IN_PROGRESS}>
            In Progress
          </SelectItem>
          <SelectItem value={PROJECT_STATUS.COMPLETED}>Completed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </motion.div>
);

const MentorFields = ({ formData, handleInputChange }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="col-span-2 space-y-6 border-t pt-6"
  >
    <h3 className="text-xl font-semibold">Mentor Details</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <Label htmlFor="mentorDetails.expertise">Areas of Expertise</Label>
        <Input
          id="mentorDetails.expertise"
          name="mentorDetails.expertise"
          value={formData.mentorDetails.expertise}
          onChange={handleInputChange}
          placeholder="e.g., Web Development, Machine Learning"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="mentorDetails.yearsOfExperience">
          Years of Experience
        </Label>
        <Input
          id="mentorDetails.yearsOfExperience"
          name="mentorDetails.yearsOfExperience"
          type="number"
          value={formData.mentorDetails.yearsOfExperience}
          onChange={handleInputChange}
          placeholder="Enter years of experience"
          className="mt-1"
        />
      </div>
      <div className="col-span-2">
        <Label htmlFor="mentorDetails.certifications">Certifications</Label>
        <Input
          id="mentorDetails.certifications"
          name="mentorDetails.certifications"
          value={formData.mentorDetails.certifications}
          onChange={handleInputChange}
          placeholder="List your relevant certifications (comma-separated)"
          className="mt-1"
        />
      </div>
    </div>
  </motion.div>
);

const ProfileStepTwo = ({
  formData,
  error,
  handleInputChange,
  handleProjectChange,
  addProject,
  removeProject,
  PROJECT_STATUS,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6"
    >
      {error && (
        <Alert variant="destructive" className="col-span-2 mb-4">
          <AlertDescription>
            {Object.entries(error).map(([field, messages]) => (
              <div key={field}>
                {field}:{" "}
                {Array.isArray(messages) ? messages.join(", ") : messages}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              className="mt-1 bg-muted"
              readOnly
            />
          </div>
          <div>
            <Label htmlFor="skills">Skills</Label>
            <Input
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleInputChange}
              placeholder="e.g., JavaScript, React, Node.js (comma-separated)"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Projects & Achievements</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="achievements">Achievements</Label>
            <Textarea
              id="achievements"
              name="achievements"
              value={formData.achievements}
              onChange={handleInputChange}
              placeholder="List your key achievements (comma-separated)"
              className="mt-1"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Projects</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProject}
              >
                Add Project
              </Button>
            </div>
            <AnimatePresence>
              {formData.ongoing_projects.map((project, index) => (
                <ProjectForm
                  key={index}
                  project={project}
                  index={index}
                  handleProjectChange={handleProjectChange}
                  removeProject={removeProject}
                  PROJECT_STATUS={PROJECT_STATUS}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {formData.type === "mentor" && (
        <MentorFields
          formData={formData}
          handleInputChange={handleInputChange}
        />
      )}
    </motion.div>
  );
};

export default ProfileStepTwo;
