"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Star } from "lucide-react";
import Link from "next/link";

interface MentorProfile {
  userId: string;
  name: string;
  imageUrl?: string;
  title?: string;
  mentorExpertise: string[];
  yearsOfExperience?: number;
  mentorRating?: number;
  organization?: string;
}

export default function MentorsPage() {
  const { user, isLoading } = useUser();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        console.log("Fetching mentors...");
        const response = await fetch("/api/mentors");
        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Received mentors data:", data);
        setMentors(data);
      } catch (error) {
        console.error("Error fetching mentors:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch mentors"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  if (!isLoading && !user) {
    redirect("/api/auth/login");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Find a Mentor</h1>
        <div className="text-sm text-muted-foreground">
          Found {mentors.length} mentors
        </div>
      </div>

      {mentors.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              No mentors available at the moment. This might be because:
            </p>
            <ul className="list-disc pl-6 mt-2 text-sm text-muted-foreground">
              <li>No profiles are set to type "mentor" in the database</li>
              <li>No mentors have set availableForMentorship to true</li>
              <li>The database connection might need to be checked</li>
            </ul>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {mentors.map((mentor) => (
            <Card key={mentor.userId}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  {mentor.imageUrl ? (
                    <img
                      src={mentor.imageUrl}
                      alt={mentor.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{mentor.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {mentor.title || "Mentor"}{" "}
                      {mentor.organization && `at ${mentor.organization}`}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  {mentor.mentorRating && (
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">
                        {mentor.mentorRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {mentor.mentorExpertise
                      .slice(0, 3)
                      .map((expertise, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-secondary rounded-full"
                        >
                          {expertise}
                        </span>
                      ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {mentor.yearsOfExperience
                      ? `${mentor.yearsOfExperience}+ years of experience`
                      : "Experienced mentor"}
                  </p>
                </div>
                <Link href={`/mentor/${mentor.userId}`}>
                  <Button variant="secondary" className="w-full">
                    View Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
