import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Github,
  Upload,
  UserCheck,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";

const VerificationFlow = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationData, setVerificationData] = useState({
    github: { username: "", verified: false },
    documents: { files: [], verified: false },
    identity: { email: "", verified: false },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const totalSteps = 3;
  const progress = ((currentStep - 1) / totalSteps) * 100;

  const handleGithubVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/verification/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUsername: verificationData.github.username,
          action: "verify",
        }),
      });

      const data = await response.json();
      if (data.verified) {
        setVerificationData((prev) => ({
          ...prev,
          github: { ...prev.github, verified: true },
        }));
        setCurrentStep(2);
      } else {
        setError(data.error || "GitHub verification failed");
      }
    } catch (error) {
      setError("Failed to verify GitHub account");
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    setLoading(true);
    setError(null);
    const files = Array.from(e.target.files);
    try {
      // Create FormData with documents
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`document${index}`, file);
      });

      const response = await fetch("/api/verification/documents", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.verified) {
        setVerificationData((prev) => ({
          ...prev,
          documents: { files, verified: true },
        }));
        setCurrentStep(3);
      } else {
        setError(data.error || "Document verification failed");
      }
    } catch (error) {
      setError("Failed to verify documents");
    } finally {
      setLoading(false);
    }
  };

  const handleIdentityVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      // Using email verification as a free identity verification method
      const response = await fetch("/api/verification/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verificationData.identity.email,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setVerificationData((prev) => ({
          ...prev,
          identity: { ...prev.identity, verified: true },
        }));
        onComplete(verificationData);
      } else {
        setError(data.error || "Identity verification failed");
      }
    } catch (error) {
      setError("Failed to verify identity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Mentor Verification</CardTitle>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              <h3 className="text-lg font-medium">GitHub Verification</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub Username</Label>
              <Input
                id="github"
                value={verificationData.github.username}
                onChange={(e) =>
                  setVerificationData((prev) => ({
                    ...prev,
                    github: { ...prev.github, username: e.target.value },
                  }))
                }
                placeholder="Enter your GitHub username"
              />
            </div>
            <Button
              onClick={handleGithubVerification}
              disabled={loading || !verificationData.github.username}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Verify GitHub
            </Button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              <h3 className="text-lg font-medium">Document Verification</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="documents">Upload Documents</Label>
              <Input
                id="documents"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleDocumentUpload}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">
                Upload any relevant certificates, degrees, or professional
                credentials
              </p>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              <h3 className="text-lg font-medium">Identity Verification</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={verificationData.identity.email}
                onChange={(e) =>
                  setVerificationData((prev) => ({
                    ...prev,
                    identity: { ...prev.identity, email: e.target.value },
                  }))
                }
                placeholder="Enter your email address"
              />
            </div>
            <Button
              onClick={handleIdentityVerification}
              disabled={loading || !verificationData.identity.email}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Complete Verification
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VerificationFlow;
