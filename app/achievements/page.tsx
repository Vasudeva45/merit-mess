"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { getMyProjectGroups } from "@/actions/group";

export default function AchievementsPage() {
  const { user, isLoading: userLoading } = useUser();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (user) {
        try {
          const projectGroups = await getMyProjectGroups();
          setProjects(projectGroups);
          console.log("User ID:", user.sub);
          projectGroups.forEach((project) => {
            console.log("Project Group Users:");
            project.members.forEach((member) => {
              console.log(
                "- Name:",
                member.profile.name,
                "| User ID:",
                member.userId
              );
            });
          });
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching projects:", error);
          setIsLoading(false);
        }
      }
    };

    fetchProjects();
  }, [user]);

  if (!userLoading && !user) {
    redirect("/api/auth/login");
  }

  const totalPoints = projects.reduce((acc, project) => {
    if (project.status === "completed") {
      return acc + 50;
    }
    return acc;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Achievements</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="font-bold">{totalPoints} Points</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{project.form.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {project.status === "completed" ? "50 points" : "Ongoing"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {project.status === "completed"
                    ? "Project completed!"
                    : "Complete your project to earn this achievement."}
                </p>
                <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: project.status === "completed" ? "100%" : "60%",
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {project.status === "completed"
                    ? "Completed"
                    : "60% Complete"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
