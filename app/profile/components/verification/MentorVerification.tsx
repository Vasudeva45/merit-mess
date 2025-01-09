// components/verification/MentorVerification.tsx
import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  initiateMentorVerification,
  getVerificationStatus,
} from "@/actions/mentorVerification";

export const MentorVerificationForm = ({ userId }: { userId: string }) => {
  const [githubUsername, setGithubUsername] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVerificationStatus();
  }, [userId]);

  const loadVerificationStatus = async () => {
    try {
      const status = await getVerificationStatus(userId);
      setStatus(status);
    } catch (error) {
      console.error("Error loading verification status:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUsername,
          documents: [], // Handle document upload separately
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      await loadVerificationStatus();
    } catch (error) {
      setError(error.message);
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
              We'll verify your professional experience through GitHub
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
