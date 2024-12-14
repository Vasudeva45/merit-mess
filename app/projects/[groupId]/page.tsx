"use client";

import { getProjectDetails, updateProjectStatus } from "@/actions/task";
import DiscussionBoard from "@/components/TaskRelated/DiscussionBoard";
import ProjectFiles from "@/components/TaskRelated/ProjectFiles";
import ProjectMembers from "@/components/TaskRelated/ProjectMembers";
import TaskBoard from "@/components/TaskRelated/TaskBoard";
import CalendarView from "@/components/TaskRelated/CalendarView";
import MentorCard from "@/components/TaskRelated/MentorCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Zap, Check, ChevronDown } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MentorActions from "@/components/TaskRelated/MentorActions";
import { toast } from "sonner";

const MAX_DESCRIPTION_LENGTH = 50;
const PROJECT_STATUSES = {
  active: { label: "Active", variant: "default" },
  completed: { label: "Completed", variant: "success" },
  archived: { label: "Archived", variant: "secondary" },
};

export default function ProjectRoom() {
  const params = useParams();
  const groupId = Number(params.groupId);
  const { user } = useUser();
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("tasks");
  const [newStatus, setNewStatus] = useState("active");
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);

  const isMentor = user?.sub && projectData?.mentorId === user.sub;
  const isOwnerOrAdmin = projectData?.members.some(
    (m) => m.userId === user?.sub && (m.role === "owner" || m.role === "admin")
  );

  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProjectDetails(groupId);
      setProjectData(data);
      setNewStatus(data.status || "active");
    } catch (err) {
      setError("Failed to load project details");
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const renderMentorActions = () => {
    if (!isMentor) return null;
    return (
      <MentorActions
        groupId={groupId}
        onUpdate={fetchProjectData}
        tasks={projectData?.tasks || []}
      />
    );
  };

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const updateProjectStatusHandler = async (selectedStatus: string) => {
    // Only allow update if user is owner or admin
    if (!isOwnerOrAdmin) {
      toast({
        title: "Unauthorized",
        description: "Only project owners or admins can change project status",
        variant: "destructive",
      });
      return;
    }

    try {
      // Immediately update the local state
      setNewStatus(selectedStatus);
      setIsStatusUpdating(true);

      // Update the status on the server
      await updateProjectStatus(groupId, selectedStatus);

      // Optionally refetch to ensure consistency
      await fetchProjectData();

      toast({
        title: "Success",
        description: "Project status updated successfully",
      });
    } catch (err) {
      // Revert the status if update fails
      setNewStatus(projectData?.status || "active");

      toast({
        title: "Error",
        description: err.message || "Failed to update project status",
        variant: "destructive",
      });
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const getShortDescription = () => {
    const description = projectData?.form?.description;
    if (!description) return "";

    if (description.length <= MAX_DESCRIPTION_LENGTH) {
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
      {/* Description Dialog/Modal */}
      <Dialog
        open={isDescriptionModalOpen}
        onOpenChange={setIsDescriptionModalOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Project Description</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700">{projectData?.form?.description}</p>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{projectData?.form?.name}</h1>
          <div className="mt-2">
            <p className="text-gray-500 inline">{getShortDescription()}</p>
            {projectData?.form?.description?.length >
              MAX_DESCRIPTION_LENGTH && (
              <button
                onClick={() => setIsDescriptionModalOpen(true)}
                className="ml-2 text-blue-500 hover:text-blue-700 text-sm font-medium"
              >
                Show more
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Owner:{" "}
            <span className="font-semibold">
              {
                projectData?.members.find((m) => m.role === "owner")?.profile
                  ?.name
              }
            </span>
          </div>

          <div className="text-sm text-gray-500 flex items-center">
            Status:{" "}
            {isOwnerOrAdmin ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={isStatusUpdating}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 flex items-center"
                  >
                    <Badge
                      variant={PROJECT_STATUSES[newStatus].variant}
                      className="mr-2"
                    >
                      {PROJECT_STATUSES[newStatus].label}
                    </Badge>
                    {isStatusUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {Object.keys(PROJECT_STATUSES)
                    .filter((status) => status !== newStatus)
                    .map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onSelect={() => updateProjectStatusHandler(status)}
                      >
                        <Badge
                          variant={PROJECT_STATUSES[status].variant}
                          className="mr-2"
                        >
                          {PROJECT_STATUSES[status].label}
                        </Badge>
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Badge
                variant={PROJECT_STATUSES[newStatus].variant}
                className="ml-2"
              >
                {PROJECT_STATUSES[newStatus].label}
              </Badge>
            )}
          </div>
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
