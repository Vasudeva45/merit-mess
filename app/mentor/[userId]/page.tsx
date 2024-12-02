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
import { toast } from "sonner";

export default function MentorProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const searchParams = useSearchParams();
  const isAlreadyMentor = searchParams.get("isProjectMentor") === "true";

  const [mentor, setMentor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectGroups, setProjectGroups] = useState([]);
  const [selectedProjectGroup, setSelectedProjectGroup] = useState(null);
  const [mentorshipMessage, setMentorshipMessage] = useState("");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  // New state for rating
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [canRate, setCanRate] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);

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

        // Check if user can rate this mentor
        try {
          const ratingCheck = await checkIfUserHasRatedMentor(params.userId);
          setCanRate(ratingCheck.canRate);
          setHasRated(ratingCheck.hasRated);
          if (ratingCheck.hasRated) {
            setUserRating(ratingCheck.existingRating);
          }
        } catch (ratingError) {
          console.error("Rating check error:", ratingError);
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchMentorProfile();
  }, [params.userId]);

  const openRatingDialog = () => {
    setIsRatingDialogOpen(true);
  };

  const handleRating = async () => {
    if (userRating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRatingSubmitting(true); // Start loading state

      const result = await rateMentor({
        mentorId: params.userId,
        rating: userRating,
      });

      // Update mentor's rating in the local state
      setMentor((prev) => ({
        ...prev,
        mentorRating: result.averageRating,
      }));

      setIsRatingDialogOpen(false);
      setHasRated(true);

      toast({
        title: "Success",
        description: "Mentor rated successfully",
        variant: "default",
      });
    } catch (err) {
      // If it's a self-rating error, show an error state in the dialog
      if (err.message.includes("You cannot rate yourself")) {
        setRatingError("You cannot rate your own profile");
      } else {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsRatingSubmitting(false); // End loading state
    }
  };

  const [ratingError, setRatingError] = useState<string | null>(null);

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
    try {
      const groups = await getMyProjectGroups();
      setProjectGroups(groups);
      setIsRequestDialogOpen(true);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch project groups",
        variant: "destructive",
      });
    }
  };

  const handleOrderMentorship = async () => {
    if (!selectedProjectGroup) {
      toast({
        title: "Error",
        description: "Please select a project group",
        variant: "destructive",
      });
      return;
    }

    try {
      const request = await createMentorshipRequest({
        mentorId: params.userId,
        projectGroupId: selectedProjectGroup,
        message: mentorshipMessage,
      });

      toast({
        title: "Success",
        description: "Mentorship request sent successfully",
        variant: "default",
      });

      setIsRequestDialogOpen(false);
      setSelectedProjectGroup(null);
      setMentorshipMessage("");
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Rest of your existing render logic for loading and error states...
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
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {mentor.imageUrl ? (
                <img
                  src={mentor.imageUrl}
                  alt={mentor.name}
                  className="h-32 w-32 rounded-full object-cover"
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
            {mentor.mentorExpertise?.map((expertise, index) => (
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
              {mentor.certifications.map((cert, index) => (
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
              {mentor.mentoredProjects.map((project, index) => (
                <div key={index} className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                </div>
              ))}
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
              disabled={!selectedProjectGroup}
              className="w-full"
            >
              Send Mentorship Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rate Mentor</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-2 py-4">
            {renderStarRating()}
          </div>
          <Button
            onClick={handleRating}
            disabled={userRating === 0}
            className="w-full"
          >
            Submit Rating
          </Button>
        </DialogContent>
      </Dialog>
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

          {/* Show error message if exists */}
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
    </div>
  );
}
