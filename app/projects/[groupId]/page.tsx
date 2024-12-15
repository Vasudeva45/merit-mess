"use client";

import {
  getMeetings,
  getProjectDetails,
  updateProjectStatus,
} from "@/actions/task";
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
import {
  Loader2,
  Zap,
  ChevronDown,
  CalendarClock,
  BookOpen,
  ClipboardList,
  Users,
  FileText,
  Calendar,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MentorActions from "@/components/TaskRelated/MentorActions";
import { toast } from "sonner";
import MeetingsView from "@/components/TaskRelated/MeetingsView";
import ResourcesView from "@/components/TaskRelated/ResourcesView";

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

  const [meetings, setMeetings] = useState([]);
  const [resources, setResources] = useState([]);

  const isMentor = user?.sub && projectData?.mentorId === user.sub;
  const isOwnerOrAdmin = projectData?.members.some(
    (m) => m.userId === user?.sub && (m.role === "owner" || m.role === "admin")
  );

  const fetchProjectData = useCallback(async () => {
    try {
      const [projectData, meetingsData] = await Promise.all([
        getProjectDetails(groupId),
        getMeetings(groupId),
      ]);

      // Extract resources from discussions (assuming they're stored there)
      const extractedResources = projectData.discussions
        .filter((discussion) => discussion.title.startsWith("New Resource:"))
        .map((discussion) => ({
          name: discussion.title.replace("New Resource: ", ""),
          description: discussion.content,
        }));

      setProjectData(projectData);
      setMeetings(meetingsData);
      setResources(extractedResources);
      setNewStatus(projectData.status || "active");
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
    <div className="container mx-auto px-4 py-4 space-y-4 max-w-full">
      {/* Description Dialog/Modal */}
      <Dialog
        open={isDescriptionModalOpen}
        onOpenChange={setIsDescriptionModalOpen}
      >
        <DialogContent className="max-w-md sm:max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>Project Description</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 text-sm sm:text-base">
            {projectData?.form?.description}
          </p>
        </DialogContent>
      </Dialog>

      {/* Description and Header Section - Mobile Optimized */}
      <div className="flex flex-col space-y-4">
        <div className="w-full">
          <h1 className="text-xl sm:text-3xl font-bold break-words">
            {projectData?.form?.name}
          </h1>
          <div className="mt-2">
            <p className="text-gray-500 text-xs sm:text-base inline-block">
              {getShortDescription()}
            </p>
            {projectData?.form?.description?.length >
              MAX_DESCRIPTION_LENGTH && (
              <button
                onClick={() => setIsDescriptionModalOpen(true)}
                className="ml-2 text-blue-500 hover:text-blue-700 text-xs sm:text-sm font-medium"
              >
                Show more
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <div className="text-xs sm:text-sm text-gray-500 w-full">
            Owner:{" "}
            <span className="font-semibold">
              {
                projectData?.members.find((m) => m.role === "owner")?.profile
                  ?.name
              }
            </span>
          </div>

          <div className="text-xs sm:text-sm text-gray-500 flex items-center">
            Status:{" "}
            {isOwnerOrAdmin ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={isStatusUpdating}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 flex items-center text-xs"
                  >
                    <Badge
                      variant={PROJECT_STATUSES[newStatus].variant}
                      className="mr-2 text-[0.6rem] sm:text-xs"
                    >
                      {PROJECT_STATUSES[newStatus].label}
                    </Badge>
                    {isStatusUpdating ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    ) : (
                      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
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
                          className="mr-2 text-xs"
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
                className="ml-2 text-[0.6rem] sm:text-xs"
              >
                {PROJECT_STATUSES[newStatus].label}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Mentor Card and Actions - Fully Responsive */}
      {projectData?.mentor && (
        <div className="w-full">
          <MentorCard
            mentor={projectData.mentor}
            isMentor={isMentor}
            projectHasMentor={Boolean(projectData.mentorId)}
          />
        </div>
      )}
      {renderMentorActions()}

      {/* Tabs and Navigation - Enhanced Mobile Layout */}
      <div className="flex flex-col space-y-4">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full space-y-4"
        >
          {/* Horizontal Scrollable Tabs */}
          <TabsList className="w-full overflow-x-auto p-1">
            <div className="flex space-x-2">
              <TabsTrigger
                value="tasks"
                className="flex-1 text-xs sm:text-base py-1 px-2"
              >
                <ClipboardList className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger
                value="members"
                className="flex-1 text-xs sm:text-base py-1 px-2"
              >
                <Users className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                Members
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="flex-1 text-xs sm:text-base py-1 px-2"
              >
                <FileText className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                Files
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="flex-1 text-xs sm:text-base py-1 px-2"
              >
                <Calendar className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                Calendar
              </TabsTrigger>
            </div>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="tasks" className="space-y-4">
            <TaskBoard
              tasks={projectData?.tasks || []}
              members={projectData?.members || []}
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
              files={
                projectData?.files?.filter((file) => !file.isResource) || []
              }
              groupId={groupId}
              onUpdate={fetchProjectData}
            />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <CalendarView tasks={projectData?.tasks || []} />
          </TabsContent>
        </Tabs>

        {/* Side Buttons - Fully Responsive */}
        <div className="flex justify-center space-x-4 w-full">
          <Button
            variant={activeTab === "meetings" ? "default" : "outline"}
            size="icon"
            onClick={() => setActiveTab("meetings")}
            className="hover:bg-blue-100 w-12 h-12"
          >
            <CalendarClock className="h-5 w-5" />
          </Button>
          <Button
            variant={activeTab === "resources" ? "default" : "outline"}
            size="icon"
            onClick={() => setActiveTab("resources")}
            className="hover:bg-green-100 w-12 h-12"
          >
            <BookOpen className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Meetings and Resources Sections */}
      {activeTab === "meetings" && (
        <div className="mt-4">
          <MeetingsView
            meetings={meetings}
            groupId={groupId}
            onUpdate={fetchProjectData}
          />
        </div>
      )}

      {activeTab === "resources" && (
        <div className="mt-4">
          <ResourcesView
            resources={resources}
            groupId={groupId}
            onUpdate={fetchProjectData}
          />
        </div>
      )}
    </div>
  );
}
