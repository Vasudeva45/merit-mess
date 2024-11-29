"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Star,
  Calendar,
  MapPin,
  Mail,
  Linkedin,
  Github,
  Trophy,
  BookOpen,
} from "lucide-react";

export default function MentorProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const [mentor, setMentor] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchMentorProfile = async () => {
      try {
        const response = await fetch(`/api/profile/${params.userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch mentor profile");
        }
        const data = await response.json();
        setMentor(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMentorProfile();
  }, [params.userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="m-4">
        <CardContent className="p-6">
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!mentor) {
    return (
      <Card className="m-4">
        <CardContent className="p-6">
          <p className="text-center">Mentor profile not found</p>
        </CardContent>
      </Card>
    );
  }

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
                {mentor.mentorRating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">
                      {mentor.mentorRating.toFixed(1)}
                    </span>
                  </span>
                )}
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
    </div>
  );
}
