"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, Copy, X } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface FormLinkShareProps {
  shareURL: string;
}

const FormLinkShare: React.FC<FormLinkShareProps> = ({ shareURL }) => {
  const [showToast, setShowToast] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const shareLink = `${window.location.origin}/submit/${shareURL}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-grow gap-4 items-center">
        <Input value={shareLink} readOnly className="bg-background" />
        <Button
          className="w-[250px] flex items-center gap-2"
          onClick={handleCopyLink}
        >
          <Copy className="h-4 w-4" />
          Share Link
        </Button>
      </div>

      {showToast && (
        <div className="absolute top-full right-0 mt-4 z-50 animate-in fade-in slide-in-from-top-1">
          <Alert className="bg-green-50 border-green-200 w-64">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 text-sm">Success!</AlertTitle>
            <AlertDescription className="text-green-600 text-xs">
              Link copied to clipboard
            </AlertDescription>
            <Button
              size="icon"
              variant="ghost"
              className="h-4 w-4 absolute top-3 right-3 text-green-600 hover:text-green-700 hover:bg-green-100"
              onClick={() => setShowToast(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default FormLinkShare;
