import React, { useState, useEffect, useCallback } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, RefreshCw } from "lucide-react";

const VerificationStatus = ({ status: initialStatus, userId, onVerified }) => {
  const [status, setStatus] = useState({
    githubVerified: initialStatus?.githubVerified || false,
    documentsVerified: initialStatus?.documentsVerified || false,
    identityVerified: initialStatus?.identityVerified || false,
    overallStatus: initialStatus?.overallStatus || "pending",
    progress: 0,
    score: initialStatus?.score || 0,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/verification/status?userId=${userId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch verification status");
      }

      const data = await response.json();

      // Calculate progress based on verified items
      const verifiedCount = [
        data.githubVerified,
        data.documentsVerified,
        data.identityVerified,
      ].filter(Boolean).length;

      const progress = (verifiedCount / 3) * 100;

      setStatus({
        ...data,
        progress,
      });

      if (data.overallStatus === "verified") {
        onVerified?.();
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId, onVerified]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const getStatusIcon = (isVerified) => {
    if (isVerified) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    return <Clock className="h-5 w-5 text-muted-foreground animate-pulse" />;
  };

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error checking verification status</AlertTitle>
            <AlertDescription className="flex flex-col gap-4">
              <p>{error}</p>
              <Button variant="outline" onClick={checkStatus} className="w-fit">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {loading ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Clock className="h-5 w-5" />
          )}
          Verification in Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Please wait while we verify your credentials</AlertTitle>
          <AlertDescription>
            This process may take a few minutes. You&apos;ll be notified once
            the verification is complete.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Progress value={status.progress} className="w-full" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                GitHub Profile Verification
                {status.githubVerified && (
                  <span className="text-sm text-muted-foreground">
                    Score: {status.score || 0}/100
                  </span>
                )}
              </span>
              {getStatusIcon(status.githubVerified)}
            </div>
            <div className="flex items-center justify-between">
              <span>Document Verification</span>
              {getStatusIcon(status.documentsVerified)}
            </div>
            <div className="flex items-center justify-between">
              <span>Identity Verification</span>
              {getStatusIcon(status.identityVerified)}
            </div>
          </div>
        </div>

        {status.overallStatus === "verified" && (
          <Alert className="bg-green-500/15 text-green-500 border-green-500/50">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Verification Complete</AlertTitle>
            <AlertDescription>
              Your mentor profile has been verified! You can now start
              mentoring.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default VerificationStatus;
