import { getProfile } from "@/actions/profile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, Github, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProfileStepOne from "./ProfileStepOne";
import ProfileStepTwo from "./ProfileStepTwo";
import GithubSuccessModal from "./verification/GithubSuccessModal";

const PROJECT_STATUS = {
  PLANNING: "planning",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
} as const;

// Helper function to safely convert string to array
const stringToArray = (str) => {
  if (!str || typeof str !== "string") return [];
  return str
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const GithubVerificationStep = ({
  githubUsername,
  setGithubUsername,
  onVerificationSuccess,
  onClose,
  pendingProfile,
}) => {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [verificationCode, setVerificationCode] = useState(null);
  const [verificationStep, setVerificationStep] = useState("initial");
  const [verificationResult, setVerificationResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [requirementsCheck, setRequirementsCheck] = useState(null);

  const initiateVerification = async () => {
    try {
      setIsVerifying(true);
      setError(null);
      setRequirementsCheck(null);

      const response = await fetch("/api/verification/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUsername,
          action: "initiate",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to initiate verification");
      }

      if (!result.requirementsCheck) {
        setRequirementsCheck(result.details);
        setVerificationStep("failed_requirements");
        return;
      }

      setVerificationCode(result.verificationCode);
      setVerificationStep("verifying");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const renderRequirementsFailure = () => (
    <Alert variant="destructive" className="mt-4">
      <XCircle className="h-4 w-4" />
      <AlertTitle>Account Requirements Not Met</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>Your GitHub account doesn&apos;t meet the minimum requirements:</p>
        <ul className="list-disc pl-4 space-y-1">
          {requirementsCheck.failing.map((fail, index) => (
            <li key={index}>
              {fail.requirement}: Current {fail.current} (Minimum:{" "}
              {fail.minimum})
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );

  const completeVerification = async () => {
    try {
      setIsVerifying(true);
      setError(null);

      const response = await fetch("/api/verification/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUsername,
          profileData: pendingProfile,
          action: "verify",
        }),
      });

      const result = await response.json();
      setVerificationResult(result);

      if (!response.ok) {
        throw new Error(result.error || "Verification failed");
      }

      if (result.verified) {
        setVerificationStep("success");
      } else {
        setVerificationStep("failed");
        setError(
          result.error ||
            "Verification requirements not met. Please check the details below."
        );
      }

      // Show result modal in both success and failure cases
      setShowResultModal(true);
    } catch (error) {
      setError(error.message);
      setVerificationStep("failed");
      setShowResultModal(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleModalClose = () => {
    setShowResultModal(false);

    if (verificationResult?.verified) {
      // If verification was successful, proceed with navigation
      onVerificationSuccess?.(verificationResult);
      onClose();
      router.push("/profile?welcome=true");
    } else {
      // If verification failed, reset to initial state
      setVerificationStep("initial");
      setError(null);
      setVerificationResult(null);
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {verificationStep === "initial" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="githubUsername">GitHub Username</Label>
                <div className="relative">
                  <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="githubUsername"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="Enter your GitHub username"
                    className="pl-10"
                  />
                </div>
              </div>
              <Button
                onClick={initiateVerification}
                disabled={isVerifying || !githubUsername}
                className="w-full"
              >
                {isVerifying ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Checking Requirements...</span>
                  </div>
                ) : (
                  "Start Verification"
                )}
              </Button>
            </div>
          )}

          {verificationStep === "failed_requirements" &&
            renderRequirementsFailure()}

          {verificationStep === "verifying" && verificationCode && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Verification Code: {verificationCode}</AlertTitle>
                <AlertDescription>
                  Complete ONE of the following steps to verify your GitHub
                  account:
                  <ol className="list-decimal ml-6 mt-2 space-y-2">
                    <li>
                      Create a public repository named
                      &apos;verification-repo&apos; with a file containing this
                      code
                    </li>
                    <li>Create a public gist containing this code</li>
                    <li>Add this code to your GitHub bio temporarily</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <Button
                onClick={completeVerification}
                disabled={isVerifying}
                className="w-full"
              >
                {isVerifying ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  "Complete Verification"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <GithubSuccessModal
        isOpen={showResultModal}
        onClose={handleModalClose}
        verificationDetails={verificationResult}
        error={error}
      />
    </>
  );
};

const ProfileTypeModal = ({ isOpen, onClose, onTypeSelect, user }) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [githubUsername, setGithubUsername] = useState("");
  const [githubVerified, setGithubVerified] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    name: "",
    email: "",
    skills: "",
    achievements: "",
    ongoing_projects: [
      { name: "", description: "", status: PROJECT_STATUS.PLANNING },
    ],
    mentorDetails: {
      expertise: "",
      yearsOfExperience: "",
      availableForMentorship: false,
      certifications: "",
    },
    studentDetails: {
      currentLevel: "",
      interests: "",
      goals: "",
      preferredLanguages: "",
    },
  });

  console.log(githubVerified);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const profile = await getProfile();
        if (profile) {
          setFormData((prevState) => ({
            ...prevState,
            ...profile,
            email: profile.email || user?.email || "",
          }));
          if (profile.type) {
            setCurrentStep(2);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadProfileData();
    }
  }, [isOpen, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setError(null);
    if (name === "email") return;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTypeSelect = (type) => {
    setError(null);
    setFormData((prev) => ({ ...prev, type }));
    setCurrentStep(2);
  };

  const handleGithubVerified = async (result) => {
    console.log(result);
    setGithubVerified(true);
    // Close modal before navigation
    onClose();
    // Navigate after a short delay
    setTimeout(() => {
      router.push("/profile?welcome=true");
    }, 100);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const formattedData = {
        ...formData,
        skills: stringToArray(formData.skills),
        achievements: stringToArray(formData.achievements),
        ongoing_projects: (formData.ongoing_projects || []).filter(
          (project) => project?.name?.trim() !== ""
        ),
      };

      if (formData.type === "mentor") {
        if (!formData.mentorDetails) {
          setError({ general: "Mentor details are required" });
          return;
        }

        const mentorData = {
          ...formattedData,
          mentorDetails: {
            ...formData.mentorDetails,
            expertise: stringToArray(formData.mentorDetails?.expertise),
            certifications: stringToArray(
              formData.mentorDetails?.certifications
            ),
            yearsOfExperience:
              parseInt(formData.mentorDetails?.yearsOfExperience) || 0,
            availableForMentorship: true,
          },
        };
        delete mentorData.studentDetails;
        setCurrentStep(3); // Move to GitHub verification step
      } else {
        // For student profile
        const studentData = {
          ...formattedData,
          studentDetails: {
            ...formData.studentDetails,
            interests: stringToArray(formData.studentDetails?.interests),
            preferredLanguages: stringToArray(
              formData.studentDetails?.preferredLanguages
            ),
          },
        };
        delete studentData.mentorDetails;

        await onTypeSelect(studentData);
        router.push("/profile?welcome=true");
        onClose(); // Close the modal after successful submission
      }
    } catch (error) {
      console.error("Error submitting profile:", error);
      setError({ general: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen}>
        <DialogContent>
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <ProfileStepOne
              formData={formData}
              error={error}
              handleTypeSelect={handleTypeSelect}
            />
          )}
          {currentStep === 2 && (
            <ProfileStepTwo
              formData={formData}
              error={error}
              handleInputChange={handleInputChange}
              handleProjectChange={(index, field, value) => {
                const updatedProjects = [...formData.ongoing_projects];
                updatedProjects[index] = {
                  ...updatedProjects[index],
                  [field]: value,
                };
                setFormData({ ...formData, ongoing_projects: updatedProjects });
              }}
              addProject={() => {
                setFormData({
                  ...formData,
                  ongoing_projects: [
                    ...formData.ongoing_projects,
                    {
                      name: "",
                      description: "",
                      status: PROJECT_STATUS.PLANNING,
                    },
                  ],
                });
              }}
              removeProject={(index) => {
                setFormData({
                  ...formData,
                  ongoing_projects: formData.ongoing_projects.filter(
                    (_, idx) => idx !== index
                  ),
                });
              }}
              PROJECT_STATUS={PROJECT_STATUS}
            />
          )}
          {currentStep === 3 && (
            <GithubVerificationStep
              githubUsername={githubUsername}
              setGithubUsername={setGithubUsername}
              onVerificationSuccess={handleGithubVerified}
              onClose={onClose}
              pendingProfile={formData}
            />
          )}
        </AnimatePresence>

        {currentStep === 2 && (
          <div className="flex justify-between pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              disabled={isSubmitting}
              className="transition-transform hover:-translate-x-1"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="transition-transform hover:translate-x-1"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Saving...</span>
                </div>
              ) : (
                "Next"
              )}
            </Button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex justify-between pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(2)}
              disabled={isSubmitting}
              className="transition-transform hover:-translate-x-1"
            >
              Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileTypeModal;
