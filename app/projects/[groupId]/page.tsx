"use client";

import { getProjectDetails, updateProjectStatus } from "@/actions/task";
import DiscussionBoard from "@/components/TaskRelated/DiscussionBoard";
import ProjectFiles from "@/components/TaskRelated/ProjectFiles";
import ProjectMembers from "@/components/TaskRelated/ProjectMembers";
import TaskBoard from "@/components/TaskRelated/TaskBoard";
import CalendarView from "@/components/TaskRelated/CalendarView"; // New import
import MentorCard from "@/components/TaskRelated/MentorCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Zap } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Button } from "@/components/ui/button";

const MAX_DESCRIPTION_LENGTH = 50;

export default function ProjectRoom() {
  const params = useParams();
  const groupId = Number(params.groupId);
  const { user } = useUser();
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("tasks");
  const [newStatus, setNewStatus] = useState(projectData?.status || "active");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const isMentor = user?.sub && projectData?.mentorId === user.sub;

  useEffect(() => {
    fetchProjectData();
  }, [groupId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const data = await getProjectDetails(groupId);
      setProjectData(data);
      setNewStatus(data.status);
    } catch (err) {
      setError("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  const renderMentorActions = () => {
    if (!isMentor) return null;

    return (
      <div className="flex space-x-2 mb-4">
        <Button variant="outline">Review All Tasks</Button>
        <Button variant="outline">Schedule Team Meeting</Button>
        <Button variant="outline">Share Resources</Button>
      </div>
    );
  };

  const updateProjectStatusHandler = async () => {
    try {
      await updateProjectStatus(groupId, newStatus);
      fetchProjectData();
    } catch (err) {
      setError("Failed to update project status");
    }
  };

  const getDisplayDescription = () => {
    const description = projectData?.form?.description;
    if (!description) return "";

    if (description.length <= MAX_DESCRIPTION_LENGTH || isDescriptionExpanded) {
      return description;
    }
    return description.slice(0, MAX_DESCRIPTION_LENGTH) + "...";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Zap className="h-12 w-12 animate-pulse text-primary" />
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
          <div className="mt-2">
            <p className="text-gray-500 inline">{getDisplayDescription()}</p>
            {projectData?.form?.description?.length >
              MAX_DESCRIPTION_LENGTH && (
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="ml-2 text-blue-500 hover:text-blue-700 text-sm font-medium"
              >
                {isDescriptionExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Owner:{" "}
          <span className="font-semibold">
            {
              projectData?.members.find((m) => m.role === "owner")?.profile
                ?.name
            }
          </span>
        </div>
        <div className="text-sm text-gray-500">
          Status:{" "}
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            onBlur={updateProjectStatusHandler}
            className="px-4 py-2 border rounded-md"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {projectData?.mentor && (
        <MentorCard
          mentor={projectData.mentor}
          isMentor={isMentor}
          projectHasMentor={Boolean(projectData.mentorId)}
        />
      )}
      {renderMentorActions()}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
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

        <TabsContent value="calendar" className="space-y-4">
          <CalendarView tasks={projectData?.tasks || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
