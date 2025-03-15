"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  GraduationCap,
  Star,
  Calendar,
  MapPin,
  Mail,
  Linkedin,
  Github,
  Trophy,
  Zap,
  BookOpen,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  createMentorshipRequest,
  getMyProjectGroups,
  checkIfUserHasRatedMentor,
  rateMentor,
} from "@/actions/mentorship";
import CustomToast, { ToastMessage } from "@/components/Toast/custom-toast";

// Define types for the mentor object
interface Mentor {
  imageUrl?: string;
  name: string;
  title: string;
  organization?: string;
  mentorRating?: number;
  yearsOfExperience?: number;
  email?: string;
  linkedin?: string;
  github?: string;
  mentorExpertise?: string[];
  bio?: string;
  certifications?: string[];
  mentoredProjects?: {
    name: string;
    description?: string;
  }[];
}

// Define project group type
interface ProjectGroup {
  id: number;
  name: string;
  form: {
    name: string;
    description: string;
  };
}

export default function MentorProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const searchParams = useSearchParams();
  const isAlreadyMentor = searchParams.get("isProjectMentor") === "true";

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
  const [selectedProjectGroup, setSelectedProjectGroup] = useState<
    number | null
  >(null);
  const [mentorshipMessage, setMentorshipMessage] = useState("");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  // Rating states
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [canRate, setCanRate] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);
  const [isExistingRequestModalOpen, setIsExistingRequestModalOpen] =
    useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const showCustomToast = (
    title: string,
    details: string,
    type: "success" | "error"
  ) => {
    setToastMessage({ title, details });
    setToastType(type);
    setShowToast(true);
  };

  React.useEffect(() => {
    const fetchMentorProfile = async () => {
      try {
        const response = await fetch(`/api/profile/${params.userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch mentor profile");
        }
        const data = await response.json();
        setMentor(data);
        setLoading(false);

        try {
          const ratingCheck = await checkIfUserHasRatedMentor(params.userId);
          setCanRate(ratingCheck.canRate);
          setHasRated(ratingCheck.hasRated);
          if (ratingCheck.hasRated) {
            setUserRating(ratingCheck.existingRating ?? 0);
          }
        } catch (ratingError) {
          console.error("Rating check error:", ratingError);
          showCustomToast(
            "Rating Check Error",
            "Failed to check rating status",
            "error"
          );
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
        setLoading(false);
        showCustomToast(
          "Profile Error",
          "Failed to load mentor profile",
          "error"
        );
      }
    };

    fetchMentorProfile();
  }, [params.userId]);

  const openRatingDialog = () => {
    setIsRatingDialogOpen(true);
  };

  const handleRating = async () => {
    if (userRating === 0) {
      showCustomToast(
        "Rating Error",
        "Please select a rating before submitting",
        "error"
      );
      return;
    }

    try {
      setIsRatingSubmitting(true);
      const result = await rateMentor({
        mentorId: params.userId,
        rating: userRating,
      });

      setMentor((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          mentorRating: result.averageRating,
        };
      });

      setIsRatingDialogOpen(false);
      setHasRated(true);
      showCustomToast(
        "Rating Submitted",
        "Thank you for rating your mentor!",
        "success"
      );
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes("You cannot rate yourself")
      ) {
        setRatingError("You cannot rate your own profile");
      } else {
        if (err instanceof Error) {
          showCustomToast("Rating Error", err.message, "error");
        } else {
          showCustomToast("Rating Error", "An unknown error occurred", "error");
        }
      }
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  const renderStarRating = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-8 w-8 cursor-pointer ${
          star <= userRating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
        onClick={() => setUserRating(star)}
      />
    ));
  };

  const renderRatingButton = () => {
    if (!canRate) return null;

    return (
      <Button variant="outline" size="sm" onClick={openRatingDialog}>
        {hasRated ? "Update Rating" : "Rate Mentor"}
      </Button>
    );
  };

  const ratingSection =
    mentor && mentor.mentorRating != null ? (
      <span className="flex items-center gap-1">
        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">
          {Number(mentor.mentorRating).toFixed(1)}
        </span>
        {renderRatingButton()}
      </span>
    ) : (
      renderRatingButton()
    );

  const openMentorshipRequestDialog = async () => {
    // Open dialog immediately first
    setIsRequestDialogOpen(true);
    setIsLoadingProjects(true);

    try {
      const groups = await getMyProjectGroups();
      setProjectGroups(groups);
    } catch (error) {
      console.error("Failed to fetch project groups:", error);
      showCustomToast(
        "Project Groups Error",
        "Failed to fetch project groups",
        "error"
      );
      setIsRequestDialogOpen(false); // Close dialog on error
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleOrderMentorship = async () => {
    if (!selectedProjectGroup) {
      showCustomToast(
        "Request Error",
        "Please select a project group",
        "error"
      );
      setIsRequestDialogOpen(false); // Close the dialog even on error
      return;
    }

    try {
      setIsRequestSubmitting(true);
      await createMentorshipRequest({
        mentorId: params.userId,
        projectGroupId: selectedProjectGroup,
        message: mentorshipMessage,
      });

      // Close dialog first
      setIsRequestDialogOpen(false);
      setSelectedProjectGroup(null);
      setMentorshipMessage("");

      // Then show toast
      showCustomToast(
        "Request Sent",
        "Your mentorship request has been sent successfully",
        "success"
      );
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === "A mentorship request for this project already exists"
      ) {
        setIsRequestDialogOpen(false);
        setIsExistingRequestModalOpen(true);
      } else {
        setIsRequestDialogOpen(false); // Close the dialog on any error
        if (err instanceof Error) {
          showCustomToast("Request Error", err.message, "error");
        } else {
          showCustomToast(
            "Request Error",
            "An unknown error occurred",
            "error"
          );
        }
      }
    } finally {
      setIsRequestSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-6">{error}</div>;
  }

  if (!mentor) {
    return <div className="text-center p-6">Mentor profile not found</div>;
  }

  const renderMentorshipCard = () => (
    <Card>
      <CardHeader>
        <CardTitle>Mentorship</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={openMentorshipRequestDialog}
          disabled={isAlreadyMentor}
        >
          {isAlreadyMentor
            ? "Already Your Project Mentor"
            : "Request Mentorship"}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {showToast && toastMessage && (
        <CustomToast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {mentor.imageUrl ? (
                // Using a div with background image instead of Image component to avoid domain issues
                <div
                  className="h-32 w-32 rounded-full bg-center bg-cover"
                  style={{ backgroundImage: `url('${mentor.imageUrl}')` }}
                  aria-label={`Profile picture of ${mentor.name}`}
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center">
                  <GraduationCap className="h-16 w-16" />
                </div>
              )}
            </div>
            <div className="flex-grow">
              <h1 className="text-3xl font-bold mb-2">{mentor.name}</h1>
              <p className="text-xl text-muted-foreground mb-2">
                {mentor.title}
              </p>
              {mentor.organization && (
                <p className="text-muted-foreground mb-4">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {mentor.organization}
                  </span>
                </p>
              )}
              <div className="flex items-center gap-4 mb-4">
                {ratingSection}
                {mentor.yearsOfExperience && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-5 w-5" />
                    <span>{mentor.yearsOfExperience}+ years experience</span>
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {mentor.email && (
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                )}
                {mentor.linkedin && (
                  <Button variant="outline" size="sm">
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                )}
                {mentor.github && (
                  <Button variant="outline" size="sm">
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Areas of Expertise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {mentor.mentorExpertise?.map((expertise: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-secondary rounded-full text-sm"
              >
                {expertise}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {mentor.bio && (
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{mentor.bio}</p>
          </CardContent>
        </Card>
      )}

      {mentor.certifications?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {mentor.certifications.map((cert: string, index: number) => (
                <li key={index} className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  {cert}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {mentor.mentoredProjects?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Projects Mentored</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {mentor.mentoredProjects.map(
                (
                  project: {
                    name: string;
                    description?: string;
                  },
                  index: number
                ) => (
                  <div key={index} className="p-4 bg-muted rounded-lg">
                    <h3 className="font-medium mb-2">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {renderMentorshipCard()}

      {/* Mentorship Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request Mentorship</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {isLoadingProjects ? (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                  <span className="text-sm text-muted-foreground">
                    Loading projects...
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Select
                    onValueChange={(value) =>
                      setSelectedProjectGroup(Number(value))
                    }
                  >
                    <SelectTrigger className="col-span-4">
                      <SelectValue placeholder="Select a Project Group" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                          {group.form?.name && ` (${group.form.name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Textarea
                    className="col-span-4"
                    placeholder="Write a message to the mentor (optional)"
                    value={mentorshipMessage}
                    onChange={(e) => setMentorshipMessage(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleOrderMentorship}
                  disabled={!selectedProjectGroup || isRequestSubmitting}
                  className="w-full"
                >
                  {isRequestSubmitting ? (
                    <div className="flex items-center justify-center">
                      <Zap className="h-4 w-4 mr-2 animate-pulse" />
                      Sending Request...
                    </div>
                  ) : (
                    "Send Mentorship Request"
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog
        open={isRatingDialogOpen}
        onOpenChange={(open) => {
          setIsRatingDialogOpen(open);
          if (!open) {
            setRatingError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rate Mentor</DialogTitle>
          </DialogHeader>

          {ratingError && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <span className="block sm:inline">{ratingError}</span>
            </div>
          )}

          <div className="flex justify-center gap-2 py-4">
            {renderStarRating()}
          </div>
          <Button
            onClick={handleRating}
            disabled={userRating === 0 || isRatingSubmitting}
            className="w-full"
          >
            {isRatingSubmitting ? (
              <div className="flex items-center justify-center">
                <Zap className="h-4 w-4 mr-2 animate-pulse" />
                Submitting...
              </div>
            ) : (
              "Submit Rating"
            )}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Existing Request Modal */}
      <Dialog
        open={isExistingRequestModalOpen}
        onOpenChange={setIsExistingRequestModalOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Existing Mentorship Request</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <p className="mb-4">
              You already have a pending mentorship request for this project
              group.
            </p>
            <Button
              onClick={() => setIsExistingRequestModalOpen(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
