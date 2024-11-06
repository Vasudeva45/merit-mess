"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getProjectDetails } from "@/actions/task";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import TaskBoard from "@/components/TaskRelated/TaskBoard";
import DiscussionBoard from "@/components/TaskRelated/DiscussionBoard";
import ProjectMembers from "@/components/TaskRelated/ProjectMembers";
import ProjectFiles from "@/components/TaskRelated/ProjectFiles";

export default function ProjectRoom() {
  const params = useParams();
  const groupId = Number(params.groupId);
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("tasks");

  useEffect(() => {
    fetchProjectData();
  }, [groupId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const data = await getProjectDetails(groupId);
      setProjectData(data);
    } catch (err) {
      setError("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mx-auto p-4 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{projectData?.form?.name}</h1>
          <p className="text-gray-500 mt-2">{projectData?.form?.description}</p>
        </div>
        <div className="text-sm text-gray-500">
          Owner:{" "}
          <span className="font-semibold">
            {
              projectData?.members.find((m) => m.role === "owner")?.profile?.name
            }
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <TaskBoard
            tasks={projectData?.tasks || []}
            members={projectData?.members || []}
            groupId={groupId}
            onUpdate={fetchProjectData}
          />
        </TabsContent>

        <TabsContent value="discussions" className="space-y-4">
          <DiscussionBoard
            discussions={projectData?.discussions || []}
            groupId={groupId}
            onUpdate={fetchProjectData}
          />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <ProjectMembers
            members={projectData?.members || []}
            groupId={groupId}
            onUpdate={fetchProjectData}
          />
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <ProjectFiles
            files={projectData?.files || []}
            groupId={groupId}
            onUpdate={fetchProjectData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}