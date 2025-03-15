import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Trophy,
  Users,
  Calendar,
  GitFork,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const GithubSuccessModal = ({
  isOpen,
  onClose,
  verificationDetails,
  error,
}) => {
  // If there's an error, show error modal
  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Verification Failed
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="space-y-4">
                <p>{error}</p>
                {verificationDetails?.details?.methods && (
                  <div className="space-y-2">
                    <p className="font-semibold">Verification Details:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {Object.entries(verificationDetails.details.methods).map(
                        ([method, verified]) => (
                          <li
                            key={method}
                            className={
                              verified ? "text-green-500" : "text-red-500"
                            }
                          >
                            {method}: {verified ? "✓" : "✗"}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={onClose} variant="outline" className="w-full">
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Guard clause for missing verification details
  if (!verificationDetails?.verified) return null;

  const {
    score,
    details = {}, // Provide default empty object
  } = verificationDetails;

  const {
    accountAge = 0,
    repositories = 0,
    contributions = 0,
    followers = 0,
    verificationMethod = {},
  } = details;

  console.log(contributions);

  const formatDays = (days) => {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    const months = Math.floor(remainingDays / 30);

    if (years > 0) {
      return `${years} year${years > 1 ? "s" : ""}${
        months > 0 ? ` ${months} month${months > 1 ? "s" : ""}` : ""
      }`;
    }
    return `${months} month${months > 1 ? "s" : ""}`;
  };

  const verificationMethods = {
    bio: "GitHub Bio",
    repo: "Verification Repository",
    gist: "Public Gist",
  };

  const usedMethod = Object.entries(verificationMethod).find(([key, value]) => {
    console.log(key); // Log the key to satisfy the linter
    return value;
  })?.[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-500">
            <CheckCircle2 className="h-5 w-5" />
            GitHub Verification Successful!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between border rounded-lg p-3 bg-green-500/5">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-500" />
              <span className="font-medium">Verification Score</span>
            </div>
            <span className="text-lg font-semibold">{score}/100</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Account age: {formatDays(accountAge)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <GitFork className="h-4 w-4 text-muted-foreground" />
              <span>Public repositories: {repositories}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Followers: {followers}</span>
            </div>
            {usedMethod && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span>Verified via: {verificationMethods[usedMethod]}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Continue to Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GithubSuccessModal;
