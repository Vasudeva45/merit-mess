"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import isEqual from "lodash/isEqual";
import ImageUpload from "./ImageUpload";
import { ViewProfile } from "./ViewProfile";
import { EditProfile } from "./EditProfile";
import { Profile } from "./types";
import CustomToast from "@/components/Toast/custom-toast";

interface ProfileSliderProps {
  profile: Profile;
  onSave: (data: Profile) => Promise<void>;
}

const ProfileSlider: React.FC<ProfileSliderProps> = ({ profile, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Profile>({
    ...profile,
    mentorDetails:
      profile.type === "mentor"
        ? {
            expertise: profile.mentorExpertise || [],
            yearsOfExperience: profile.yearsOfExperience,
            availableForMentorship: profile.availableForMentorship || false,
            certifications: profile.certifications || [],
            mentorRating: profile.mentorRating,
            mentoredProjects: profile.mentoredProjects || [],
          }
        : undefined,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: ToastMessage;
    type: "success" | "error";
  } | null>(null);
  const hasChanges = !isEqual(profile, formData);

  const showToast = (
    title: string,
    details: string,
    type: "success" | "error"
  ) => {
    setToast({
      message: { title, details },
      type,
    });
  };

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const { imageUrl } = await response.json();

      // Only update the form data with the new image URL
      setFormData((prev) => ({ ...prev, imageUrl }));

      // Don't call onSave here as it's already being handled by the API
    } catch (error) {
      console.error("Upload error:", error);
      showToast("Error", "Failed to upload image. Please try again.", "error");
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      setIsSaving(true);
      await onSave(formData);
      showToast(
        "Profile Updated",
        "Your profile has been successfully updated.",
        "success"
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to fetch:", error);
      showToast(
        "Error",
        "Failed to update profile. Please try again.",
        "error"
      );
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
          <ImageUpload
            onUpload={handleImageUpload}
            imageUrl={formData.imageUrl}
            profileName={formData.name}
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
            <ViewProfile profile={profile} onEdit={() => setIsEditing(true)} />
          ) : (
            <EditProfile
              formData={formData}
              setFormData={setFormData}
              isSaving={isSaving}
              hasChanges={hasChanges}
              onSave={handleSave}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Custom Toast */}
      {toast && (
        <CustomToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ProfileSlider;
