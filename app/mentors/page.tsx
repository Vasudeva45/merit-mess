"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import { GraduationCap, Star, ChevronRight } from "lucide-react";
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
        const response = await fetch("/api/mentors");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setMentors(data);
      } catch (error) {
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
        <div className="animate-pulse">
          <div className="h-12 w-12 bg-secondary rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-destructive/10 border border-destructive/20 p-8 rounded-xl text-center">
          <p className="text-destructive font-semibold">Error: {error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Unable to load mentors at this time. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-extrabold tracking-tight"
        >
          Find Your Perfect Mentor
        </motion.h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Connect with experienced professionals who can guide your career
          journey
        </p>
      </div>

      {mentors.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-secondary/50 backdrop-blur-sm border border-border/50 rounded-xl p-8 text-center"
        >
          <p className="text-muted-foreground">
            No mentors are currently available
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
            <li>• Mentor profiles might be under review</li>
            <li>• No mentors have set their availability</li>
            <li>• Technical issues with mentor database</li>
          </ul>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {mentors.map((mentor) => (
            <motion.div
              key={mentor.userId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.03 }}
              className="relative overflow-hidden rounded-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-secondary/10 backdrop-blur-md rounded-2xl"></div>
              <div className="relative z-10 p-6">
                <div className="flex items-center space-x-4 mb-4">
                  {mentor.imageUrl ? (
                    <img
                      src={mentor.imageUrl}
                      alt={mentor.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-secondary/30"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-foreground/70" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{mentor.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {mentor.title || "Mentor"}{" "}
                      {mentor.organization && `at ${mentor.organization}`}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {mentor.mentorRating && (
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {mentor.mentorRating.toFixed(1)} Rating
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {mentor.mentorExpertise
                      .slice(0, 3)
                      .map((expertise, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-xs rounded-full bg-secondary/50 text-foreground/70"
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

                <Link href={`/mentor/${mentor.userId}`} className="block mt-6">
                  <button className="w-full flex items-center justify-center space-x-2 py-3 bg-secondary/80 text-foreground rounded-lg hover:bg-secondary transition-colors">
                    <span>View Profile</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
