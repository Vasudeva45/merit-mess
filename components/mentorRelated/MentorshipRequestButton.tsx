// MentorshipRequestButton.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ToastProvider, useToast } from "../../components/ui/toast";
import {
  canRequestMentorship,
  createMentorshipRequest,
} from "@/actions/mentorship";
import { AlertCircle } from "lucide-react";

interface MentorshipRequestButtonProps {
  mentorId: string;
  projectGroupId: number;
}

export const MentorshipRequestButton = ({
  mentorId,
  projectGroupId,
}: MentorshipRequestButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [canRequest, setCanRequest] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [hasMentor, setHasMentor] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkRequestEligibility();
  }, [projectGroupId]);

  const checkRequestEligibility = async () => {
    try {
      const eligibility = await canRequestMentorship(projectGroupId);
      setCanRequest(eligibility.canRequest);
      setStatusMessage(eligibility.message);
      setHasMentor(!!eligibility.existingMentor);
    } catch (error) {
      console.error("Error checking request eligibility:", error);
      setCanRequest(false);
      setStatusMessage("Error checking request eligibility");
    }
  };

  const handleRequestMentorship = async () => {
    try {
      setLoading(true);

      const request = await createMentorshipRequest({
        mentorId,
        projectGroupId,
        message: "I would like to request your mentorship for our project.",
      });

      toast({
        title: "Request Sent",
        description: "Your mentorship request has been sent successfully.",
      });

      // Update button state
      setCanRequest(false);
      setStatusMessage("Request pending");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send mentorship request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (hasMentor) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        <span>{statusMessage}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleRequestMentorship}
        disabled={!canRequest || loading}
        variant={canRequest ? "default" : "secondary"}
      >
        {loading ? "Sending Request..." : "Request Mentorship"}
      </Button>
      {statusMessage && (
        <p className="text-sm text-muted-foreground">{statusMessage}</p>
      )}
    </div>
  );
};
