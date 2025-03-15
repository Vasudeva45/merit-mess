"use client";

import { getMyProjectGroups, getProjectInvites } from "@/actions/group";
import {
  getMentorshipRequests,
  updateMentorshipRequestStatus,
} from "@/actions/mentorship";
import { getCurrentUserProfile } from "@/actions/profile";
import CustomToast from "@/components/Toast/custom-toast";
import {
  Check,
  ClipboardList,
  Clock,
  Coffee,
  FileText,
  Loader2,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const ProjectDashboard = () => {
  const [userData, setUserData] = useState({
    profile: null,
    invites: [],
    mentorInvites: [],
    projectGroups: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("projects");
  const [processingItems, setProcessingItems] = useState({});
  const [navigatingProject, setNavigatingProject] = useState(null);
  const [toast, setToast] = useState(null);
  // const router = useRouter();

  const ActionButton = ({ onClick, type, itemId, icon: Icon }) => {
    const isProcessing = processingItems[itemId];
    const baseClass =
      type === "accept"
        ? "bg-primary/10 text-primary hover:bg-primary/20"
        : "bg-destructive/10 text-destructive hover:bg-destructive/20";

    return (
      <button
        onClick={onClick}
        disabled={isProcessing}
        className={`p-2 rounded-full transition-colors relative ${baseClass}`}
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </button>
    );
  };

  // Fetch comprehensive user data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const profile = await getCurrentUserProfile();
        const [invites, projectGroups] = await Promise.all([
          getProjectInvites(),
          getMyProjectGroups(),
        ]);

        // Only fetch mentor invites if the user is a mentor
        let mentorInvites = [];
        if (profile.type === "mentor") {
          mentorInvites = await getMentorshipRequests();
        }

        setUserData({
          profile,
          invites: invites.filter((invite) => invite.status !== "accepted"),
          mentorInvites: profile.type === "mentor" ? mentorInvites : [],
          projectGroups,
        });
      } catch (error) {
        console.error("Failed to fetch user data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Process invite responses
  const handleInviteResponse = async (invite, status, type) => {
    const itemId = invite.id;
    setProcessingItems((prev) => ({ ...prev, [itemId]: true }));

    try {
      if (type === "project") {
        await fetch("/api/project-invites/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId: invite.group.id,
            memberId: invite.id,
            status,
          }),
        });

        setUserData((prev) => ({
          ...prev,
          invites: prev.invites.filter((i) => i.id !== itemId),
        }));

        setToast({
          type: "success",
          message: {
            title: `Project Invitation ${
              status === "accepted" ? "Accepted" : "Declined"
            }`,
            details: `${
              status === "accepted" ? "Joined" : "Declined"
            } project: ${invite.group.form.name}`,
          },
        });
      } else if (type === "mentor") {
        await updateMentorshipRequestStatus(itemId, status);

        setUserData((prev) => ({
          ...prev,
          mentorInvites: prev.mentorInvites.filter((i) => i.id !== itemId),
        }));

        setToast({
          type: "success",
          message: {
            title: `Mentorship Request ${
              status === "accepted" ? "Accepted" : "Declined"
            }`,
            details: `${
              status === "accepted" ? "Accepted" : "Declined"
            } mentorship request for: ${invite.projectGroup.form.name}`,
          },
        });
      }
    } catch (error) {
      console.error(`Failed to process ${type} invite`, error);
      setToast({
        type: "error",
        message: {
          title: "Action Failed",
          details: `Failed to process ${type} invitation: ${
            error.message || "Unknown error occurred"
          }`,
        },
      });
    } finally {
      setProcessingItems((prev) => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
    }
  };

  // Compute stats
  const stats = useMemo(
    () => ({
      totalProjects: userData.projectGroups.length,
      activeProjects: userData.projectGroups.filter(
        (g) => g.status === "active"
      ).length,
      pendingInvites: userData.invites.length + userData.mentorInvites.length,
    }),
    [userData]
  );

  // Render tabs based on user type
  const tabs = useMemo(() => {
    const baseTabs = [
      {
        id: "projects",
        label: "My Projects",
        icon: <FileText className="h-5 w-5" />,
      },
      {
        id: "invitations",
        label: "Invitations",
        icon: <ClipboardList className="h-5 w-5" />,
      },
    ];

    return userData.profile?.type === "mentor"
      ? [
          ...baseTabs,
          {
            id: "mentorInvites",
            label: "Mentor Requests",
            icon: <Coffee className="h-5 w-5" />,
          },
        ]
      : baseTabs;
  }, [userData.profile]);

  // Render empty state
  const renderEmptyState = (message) => (
    <div className="flex flex-col items-center justify-center p-12 bg-muted/30 rounded-xl">
      <Zap className="h-12 w-12 text-primary mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  // Project card renderer
  const renderProjectCard = (project) => {
    const handleProjectNavigation = () => {
      setNavigatingProject(project.id);
      window.open(`/projects/${project.id}`, "_blank");
      // Reset the navigating state after a short delay
      setTimeout(() => setNavigatingProject(null), 1500);
    };

    const isNavigating = navigatingProject === project.id;

    return (
      <div
        key={project.id}
        className="relative bg-card border rounded-xl p-6 hover:shadow-lg transition-all group cursor-pointer"
        onClick={handleProjectNavigation}
      >
        {isNavigating && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <Zap className="h-8 w-8 animate-pulse text-primary" />
          </div>
        )}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{project.form.name}</h3>
          <Star className="h-5 w-5 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {project.form.description.slice(0, 100)}...
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm">
              {project.members.filter((m) => m.status === "accepted").length}{" "}
              members
            </span>
          </div>
          <div className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
            {project.status}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Zap className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Projects Hub</h1>
          <p className="text-muted-foreground mt-2">
            Manage your projects, collaborations, and opportunities
          </p>
        </div>
        <div className="flex space-x-4">
          <div className="bg-card border rounded-full px-4 py-2 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>{stats.totalProjects} Total Projects</span>
          </div>
          <div className="bg-card border rounded-full px-4 py-2 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <span>{stats.pendingInvites} Pending</span>
          </div>
        </div>
      </header>

      <div className="flex space-x-4 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
      flex items-center space-x-2 px-4 py-2 rounded-full transition-all
      ${
        activeTab === tab.id
          ? "bg-primary/10 text-primary font-semibold"
          : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
      }
    `}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userData.projectGroups.length > 0
            ? userData.projectGroups.map(renderProjectCard)
            : renderEmptyState("You haven't joined any projects yet.")}
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === "invitations" && (
        <div className="space-y-4">
          {userData.invites.length > 0
            ? userData.invites.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-card border rounded-xl p-6 flex justify-between items-center"
                >
                  <div>
                    <h3 className="text-lg font-semibold">
                      {invite.group.form.name}
                    </h3>
                    <p className="text-muted-foreground">
                      {invite.group.form.description}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <ActionButton
                      onClick={() =>
                        handleInviteResponse(invite, "rejected", "project")
                      }
                      type="reject"
                      itemId={invite.id}
                      icon={X}
                    />
                    <ActionButton
                      onClick={() =>
                        handleInviteResponse(invite, "accepted", "project")
                      }
                      type="accept"
                      itemId={invite.id}
                      icon={Check}
                    />
                  </div>
                </div>
              ))
            : renderEmptyState("No pending project invitations.")}
        </div>
      )}

      {/* Mentor Invites Tab */}
      {activeTab === "mentorInvites" && userData.profile?.type === "mentor" && (
        <div className="space-y-4">
          {userData.mentorInvites.length > 0
            ? userData.mentorInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-card border rounded-xl p-6 flex flex-col space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {invite.projectGroup.form.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        {invite.projectGroup.form.description}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <ActionButton
                        onClick={() =>
                          handleInviteResponse(invite, "rejected", "mentor")
                        }
                        type="reject"
                        itemId={invite.id}
                        icon={X}
                      />
                      <ActionButton
                        onClick={() =>
                          handleInviteResponse(invite, "accepted", "mentor")
                        }
                        type="accept"
                        itemId={invite.id}
                        icon={Check}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Request from {invite.requester.name}</span>
                    {invite.message && (
                      <span className="border-l border-border pl-2 ml-2">
                        {invite.message}
                      </span>
                    )}
                  </div>
                </div>
              ))
            : renderEmptyState("No pending mentor invitations.")}
        </div>
      )}
      {toast && (
        <CustomToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ProjectDashboard;
