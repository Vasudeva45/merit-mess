"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutGrid,
  CheckCircle2,
  Clock,
  Users,
  Zap,
  TrendingUp,
  FolderOpen,
  Flame,
} from "lucide-react";

// Assuming these are imported from your actions
import { getMyProjectGroups, getProjectInvites } from "@/actions/group";

interface Project {
  id: number;
  form: {
    name: string;
    description: string;
  };
  members: {
    id: number;
    role: string;
    userId: string;
    status: string;
    groupId: number;
    joinedAt: Date;
    profile: {
      name: string;
    };
  }[];
  status: string;
}

interface Invite {
  // Define the structure of an invite if necessary
}

const InnovativeDashboard = () => {
  const [projectData, setProjectData] = useState<{
    activeProjects: Project[];
    completedProjects: Project[];
    pendingInvites: Invite[];
  }>({
    activeProjects: [],
    completedProjects: [],
    pendingInvites: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [groups, invites] = await Promise.all([
          getMyProjectGroups(),
          getProjectInvites(),
        ]);

        setProjectData({
          activeProjects: groups.filter((g) => g.status === "active"),
          completedProjects: groups.filter((g) => g.status === "completed"),
          pendingInvites: invites,
        });
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Zap className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Project Pulse
          </h1>
          <p className="text-muted-foreground">
            Your comprehensive project ecosystem
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Project Overview Widgets */}
        <div className="bg-card p-6 rounded-xl shadow-lg border">
          <div className="flex items-center justify-between mb-4">
            <LayoutGrid className="h-6 w-6 text-primary" />
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Active Projects</h3>
          <div className="text-4xl font-bold">
            {projectData.activeProjects.length}
          </div>
          <p className="text-sm text-muted-foreground">
            Ongoing innovative initiatives
          </p>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-lg border">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Completed Projects</h3>
          <div className="text-4xl font-bold">
            {projectData.completedProjects.length}
          </div>
          <p className="text-sm text-muted-foreground">
            Successfully delivered milestones
          </p>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-lg border">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-6 w-6 text-indigo-500" />
            <Clock className="h-5 w-5 text-yellow-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Pending Invites</h3>
          <div className="text-4xl font-bold">
            {projectData.pendingInvites.length}
          </div>
          <p className="text-sm text-muted-foreground">
            Collaboration opportunities
          </p>
        </div>
      </div>

      {/* Recent Activity Section */}
      <section className="bg-card rounded-xl shadow-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recent Project Highlights</h2>
          <FolderOpen className="h-6 w-6 text-primary" />
        </div>

        <div className="space-y-4">
          {projectData.activeProjects.slice(0, 3).map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all"
            >
              <div className="flex items-center space-x-4">
                <Zap className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-semibold">{project.form?.name}</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {project.status} Project
                  </p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default InnovativeDashboard;
