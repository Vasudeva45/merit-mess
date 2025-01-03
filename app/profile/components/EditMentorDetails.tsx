"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { Profile } from "./types";

interface EditMentorDetailsProps {
  formData: Profile;
  setFormData: (data: Profile) => void;
}

export const EditMentorDetails: React.FC<EditMentorDetailsProps> = ({
  formData,
  setFormData,
}) => {
  const [newExpertise, setNewExpertise] = useState("");
  const [newCertification, setNewCertification] = useState("");

  const addExpertise = () => {
    if (newExpertise.trim()) {
      setFormData({
        ...formData,
        mentorDetails: {
          ...formData.mentorDetails,
          expertise: [
            ...(formData.mentorDetails?.expertise || []),
            newExpertise.trim(),
          ],
        },
      });
      setNewExpertise("");
    }
  };

  const removeExpertise = (expertiseToRemove: string) => {
    setFormData({
      ...formData,
      mentorDetails: {
        ...formData.mentorDetails,
        expertise:
          formData.mentorDetails?.expertise?.filter(
            (exp) => exp !== expertiseToRemove
          ) || [],
      },
    });
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setFormData({
        ...formData,
        mentorDetails: {
          ...formData.mentorDetails,
          certifications: [
            ...(formData.mentorDetails?.certifications || []),
            newCertification.trim(),
          ],
        },
      });
      setNewCertification("");
    }
  };

  const removeCertification = (certToRemove: string) => {
    setFormData({
      ...formData,
      mentorDetails: {
        ...formData.mentorDetails,
        certifications:
          formData.mentorDetails?.certifications?.filter(
            (cert) => cert !== certToRemove
          ) || [],
      },
    });
  };

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        {/* Years of Experience */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">
            Years of Experience
          </label>
          <Input
            type="number"
            value={formData.mentorDetails?.yearsOfExperience || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                mentorDetails: {
                  ...formData.mentorDetails,
                  yearsOfExperience: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                },
              })
            }
            placeholder="Enter years of experience"
            className="mb-2"
          />
        </div>

        {/* Availability for Mentorship */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">
            Available for Mentorship
          </label>
          <Select
            value={
              formData.mentorDetails?.availableForMentorship?.toString() ||
              "false"
            }
            onValueChange={(value) =>
              setFormData({
                ...formData,
                mentorDetails: {
                  ...formData.mentorDetails,
                  availableForMentorship: value === "true",
                },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expertise */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">
            Areas of Expertise
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newExpertise}
              onChange={(e) => setNewExpertise(e.target.value)}
              placeholder="Add expertise"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addExpertise();
                }
              }}
            />
            <Button onClick={addExpertise} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.mentorDetails?.expertise?.map((exp) => (
              <Badge key={exp} variant="secondary" className="gap-1 px-3 py-1">
                {exp}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeExpertise(exp)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">
            Certifications
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              placeholder="Add certification"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCertification();
                }
              }}
            />
            <Button onClick={addCertification} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.mentorDetails?.certifications?.map((cert) => (
              <Badge key={cert} variant="secondary" className="gap-1 px-3 py-1">
                {cert}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeCertification(cert)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
