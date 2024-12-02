"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { redirect } from "next/navigation";
import {
  Star,
  Award,
  TrophyIcon,
  Rocket,
  CheckCircle2,
  Flag,
  Zap,
} from "lucide-react";
import { getMyProjectGroups } from "@/actions/group";

const AchievementsPage = () => {
  const { user, isLoading: userLoading } = useUser();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [achievements, setAchievements] = useState({
    totalPoints: 0,
    completedProjects: 0,
    inProgressProjects: 0,
  });

  useEffect(() => {
    const fetchProjects = async () => {
      if (user) {
        try {
          const projectGroups = await getMyProjectGroups();
          setProjects(projectGroups);

          // Enhanced achievements calculation
          const completedProjects = projectGroups.filter(
            (p) => p.status === "completed"
          );
          setAchievements({
            totalPoints: completedProjects.length * 50,
            completedProjects: completedProjects.length,
            inProgressProjects: projectGroups.filter(
              (p) => p.status !== "completed"
            ).length,
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

  const getProjectProgress = (project) => {
    // Simulate project progress (you might want to replace with actual progress tracking)
    return project.status === "completed" ? 100 : 60;
  };

  const renderProgressBar = (progress) => {
    const progressColor = progress === 100 ? "bg-green-500" : "bg-primary";

    return (
      <div className="mt-4 h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`h-full ${progressColor} transition-all duration-500 ease-in-out`}
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Zap className="h-12 w-12 animate-pulse text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center">
            <Award className="mr-3 h-10 w-10 text-primary" />
            Your Achievement Vault
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your progress and celebrate your milestones
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-card border rounded-full px-6 py-3 shadow-sm">
          <TrophyIcon className="h-6 w-6 text-primary" />
          <span className="text-2xl font-bold">
            {achievements.totalPoints} Points
          </span>
        </div>
      </header>

      {/* Achievement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-xl p-6 text-center">
          <Rocket className="mx-auto h-10 w-10 text-primary mb-4" />
          <h3 className="text-xl font-semibold">
            {achievements.completedProjects}
          </h3>
          <p className="text-muted-foreground">Completed Projects</p>
        </div>

        <div className="bg-card border rounded-xl p-6 text-center">
          <Flag className="mx-auto h-10 w-10 text-orange-500 mb-4" />
          <h3 className="text-xl font-semibold">
            {achievements.inProgressProjects}
          </h3>
          <p className="text-muted-foreground">Ongoing Projects</p>
        </div>

        <div className="bg-card border rounded-xl p-6 text-center">
          <Star className="mx-auto h-10 w-10 text-yellow-500 mb-4" />
          <h3 className="text-xl font-semibold">{projects.length}</h3>
          <p className="text-muted-foreground">Total Projects</p>
        </div>
      </div>

      {/* Projects Breakdown */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <CheckCircle2 className="mr-3 h-6 w-6 text-primary" />
          Project Achievements
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => {
            const progress = getProjectProgress(project);
            return (
              <div
                key={project.id}
                className="bg-card border rounded-xl overflow-hidden transform transition-all hover:scale-[1.02] hover:shadow-lg"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <TrophyIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {project.form.name}
                        </h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {project.status} Project
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                      {progress === 100 ? "50 pts" : "In Progress"}
                    </div>
                  </div>

                  {renderProgressBar(progress)}

                  <div className="mt-4 flex justify-between text-sm text-muted-foreground">
                    <span>{progress}% Complete</span>
                    <span>
                      {project.status === "completed"
                        ? "Milestone Achieved!"
                        : "Keep pushing forward"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default AchievementsPage;
