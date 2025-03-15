import React, { useState, useEffect, useCallback } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { getVerificationStatus } from "@/actions/mentorVerification";

interface VerificationStatus {
  status: string;
  overallStatus?: string;
  githubVerified?: boolean;
  documentsVerified?: boolean;
  identityVerified?: boolean;
}

export const MentorVerificationForm = ({ userId }: { userId: string }) => {
  const [githubUsername, setGithubUsername] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Wrap the function in useCallback to prevent it from being recreated on each render
  const loadVerificationStatus = useCallback(async () => {
    try {
      const status = await getVerificationStatus(userId);
      setStatus(status);
    } catch (error) {
      console.error("Error loading verification status:", error);
    }
  }, [userId]); // Only depends on userId

  useEffect(() => {
    loadVerificationStatus();
  }, [loadVerificationStatus]); // Now loadVerificationStatus is stable

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Using documents in the request body
      const formData = new FormData();
      formData.append("githubUsername", githubUsername);

      // Append each document to the form data
      documents.forEach((doc, index) => {
        formData.append(`document-${index}`, doc);
      });

      const response = await fetch("/api/verification", {
        method: "POST",
        body: formData, // Using FormData to handle file uploads
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      await loadVerificationStatus();
    } catch (error: unknown) {
      // Type guard to safely access error.message
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (status?.overallStatus === "verified") {
    return (
      <Alert>
        <AlertDescription>
          Your mentor profile has been verified! You can now start mentoring.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold">Mentor Verification</h2>
        <p className="text-muted-foreground">
          Complete the verification process to become a mentor
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="github">GitHub Username</Label>
            <Input
              id="github"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              placeholder="Enter your GitHub username"
            />
            <p className="text-sm text-muted-foreground">
              We&apos;ll verify your professional experience through GitHub
            </p>
          </div>

          <div className="space-y-2">
            <Label>Professional Documents</Label>
            <Input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setDocuments(Array.from(e.target.files || []))}
            />
            <p className="text-sm text-muted-foreground">
              Upload certificates, degrees, or professional credentials
            </p>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Submit for Verification"}
          </Button>
        </form>

        {status && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Verification Status</h3>
            <div className="space-y-2">
              <p>Overall Status: {status.status}</p>
              {status.githubVerified && (
                <p className="text-green-600">✓ GitHub Verified</p>
              )}
              {status.documentsVerified && (
                <p className="text-green-600">✓ Documents Verified</p>
              )}
              {status.identityVerified && (
                <p className="text-green-600">✓ Identity Verified</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
