import React from "react";
import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { getProfile, updateProfile } from "@/actions/profile";
import ProfileSlider from "./components/ProfileSlider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, AlertCircle } from "lucide-react";
import { profileSchema, type ProfileFormData } from "@/schemas/profile";
import { Toaster } from "@/components/ui/toaster";

const EmptyProfileState = ({
  onSetup,
  defaultData,
}: {
  onSetup: () => void;
  defaultData: ProfileFormData;
}) => {
  return (
    <Card className="max-w-2xl mx-auto transform hover:scale-[1.01] transition-transform">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">
          Welcome! Let's Set Up Your Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <div className="bg-gray-50 p-6 rounded-full">
            <UserPlus className="h-24 w-24 text-blue-500" />
          </div>
        </div>
        <p className="text-center text-gray-600 text-lg max-w-md mx-auto">
          Create your profile to unlock all features and connect with others on
          the platform.
        </p>
        <div className="flex justify-center">
          <Button onClick={onSetup} size="lg" className="text-lg px-8 py-6">
            Get Started
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ErrorState = ({
  error,
  onRetry,
}: {
  error: Error & { errors?: Record<string, string[]> };
  onRetry?: () => void;
}) => {
  const isValidationError = error.name === "ValidationError" && error.errors;

  return (
    <Alert variant="destructive" className="max-w-2xl mx-auto">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold">
        {isValidationError ? "Validation Error" : "Error Loading Profile"}
      </AlertTitle>
      <AlertDescription className="mt-2">
        {isValidationError ? (
          <div className="space-y-2">
            {Object.entries(error.errors).map(([field, messages]) => (
              <div key={field} className="bg-red-50 p-2 rounded">
                <strong className="capitalize">
                  {field.replace("_", " ")}:
                </strong>
                <ul className="list-disc ml-4">
                  {messages.map((message, idx) => (
                    <li key={idx}>{message}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-red-700">
            {error.message || "There was an error loading your profile."}
          </p>
        )}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-4 hover:bg-red-50"
          >
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

const Profile = async () => {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    redirect("/");
  }

  try {
    const defaultProfile: ProfileFormData = {
      name: user.name || "",
      type: "student",
      email: user.email || "",
      skills: [],
      ongoing_projects: [],
      achievements: [],
      bio: "",
      location: "",
      organization: "",
      github: "",
      linkedin: "",
    };

    const validationResult = profileSchema.safeParse(defaultProfile);
    if (!validationResult.success) {
      throw new Error("Invalid default profile data");
    }

    const profile = await getProfile();
    const isEmptyProfile = !profile || Object.keys(profile).length <= 2;

    return (
      <>
        <div className="min-h-screen">
          {isEmptyProfile ? (
            <EmptyProfileState
              defaultData={defaultProfile}
              onSetup={() => {
                return (
                  <ProfileSlider
                    profile={defaultProfile}
                    onSave={updateProfile}
                  />
                );
              }}
            />
          ) : (
            <ProfileSlider profile={profile} onSave={updateProfile} />
          )}
        </div>
        <Toaster />
      </>
    );
  } catch (error) {
    console.error("Profile error:", error);
    return (
      <div className="min-h-screen p-4">
        <ErrorState
          error={
            error instanceof Error ? error : new Error("Unknown error occurred")
          }
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
};

export default Profile;
