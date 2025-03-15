"use client";

import React from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomToast, { ToastMessage } from "@/components/Toast/custom-toast";
import Image from "next/image";

interface ImageUploadProps {
  onUpload: (file: File) => Promise<void>;
  imageUrl?: string;
  profileName?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  imageUrl,
  profileName,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [toast, setToast] = React.useState<{
    message: ToastMessage;
    type: "success" | "error";
  } | null>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        showToast("Error", "File size must be less than 5MB", "error");
        return;
      }

      try {
        await onUpload(file);
        showToast(
          "Success",
          "Profile picture uploaded successfully",
          "success"
        );
      } catch (error) {
        console.error("Upload error:", error);
        showToast(
          "Error",
          "Failed to upload image. Please try again.",
          "error"
        );
      }
    }
  };

  // Helper component to display image while handling potential issues with Next/Image
  const ProfileImage = () => {
    // If we don't have an image URL, show the first letter of profile name
    if (!imageUrl) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-4xl font-bold text-primary">
            {profileName?.charAt(0).toUpperCase() || "?"}
          </span>
        </div>
      );
    }

    // Use Next/Image with unoptimized prop to avoid remote pattern issues
    // but still satisfy the linting rule
    return (
      <div className="relative w-full h-full">
        <Image
          src={imageUrl}
          alt="Profile"
          fill
          className="object-cover"
          unoptimized={true}
          sizes="128px"
        />
      </div>
    );
  };

  return (
    <>
      <div className="relative w-32 h-32 mx-auto">
        <div className="w-full h-full rounded-full overflow-hidden border-4 border-primary/10 bg-primary/5">
          <ProfileImage />
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-0 right-0 rounded-full shadow-lg"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      {/* Custom Toast */}
      {toast && (
        <CustomToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default ImageUpload;
