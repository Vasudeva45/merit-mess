"use client";

import React, { useState, useEffect } from "react";
import {
  getMyProjectGroups,
  getProjectInvites,
  updateMemberStatus,
} from "@/actions/group";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import {
  getMentorshipRequests,
  updateMentorshipRequestStatus,
} from "@/actions/mentorship";
import { getCurrentUserProfile } from "@/actions/profile"; // Add this import

const truncateText = (text: string, maxLength: number = 100) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

const ProjectPage = () => {
  const [invites, setInvites] = useState([]);
  const [projectGroups, setProjectGroups] = useState([]);
  const [mentorInvites, setMentorInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingInvites, setProcessingInvites] = useState({});
  const [activeTab, setActiveTab] = useState("invitations");
  const [userProfileType, setUserProfileType] = useState(null);
  const router = useRouter();

  // Fetch user profile type
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getCurrentUserProfile();
        setUserProfileType(profile.type);
      } catch (err) {
        setError("Failed to load user profile");
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    // Only attempt to fetch data if profile type is loaded
    if (userProfileType !== null) {
      fetchData();
    }
  }, [activeTab, userProfileType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "invitations") {
        const invitesData = await getProjectInvites();
        setInvites(
          invitesData.filter((invite) => invite.status !== "accepted")
        );
      } else if (activeTab === "mentorInvites") {
        // Only fetch mentor invites if user is a mentor
        if (userProfileType === "mentor") {
          const mentorInvitesData = await getMentorshipRequests();
          setMentorInvites(
            mentorInvitesData.filter(
              (invite) => invite.status === "mentor_invited"
            )
          );
        }
      } else {
        const groupsData = await getMyProjectGroups();
        setProjectGroups(groupsData);
      }
    } catch (err) {
      setError("Failed to load project data");
    } finally {
      setLoading(false);
    }
  };

  const handleMentorInviteResponse = async (requestId, status) => {
    setProcessingInvites((prev) => ({ ...prev, [requestId]: true }));
    try {
      await updateMentorshipRequestStatus(requestId, status);
      setMentorInvites((prev) =>
        prev.filter((invite) => invite.id !== requestId)
      );
    } catch (err) {
      setError("Failed to process mentor invitation");
    } finally {
      setProcessingInvites((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleInviteResponse = async (groupId, memberId, status) => {
    setProcessingInvites((prev) => ({ ...prev, [memberId]: true }));
    try {
      const response = await fetch("/api/project-invites/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, memberId, status }),
      });

      if (!response.ok) throw new Error("Failed to update invitation status");

      setInvites((prev) => prev.filter((invite) => invite.id !== memberId));
    } catch (err) {
      setError("Failed to process invitation");
    } finally {
      setProcessingInvites((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleProjectGroupClick = (group) => {
    router.push(`/projects/${group.id}`);
  };

  // Filter function to show only pending or accepted members
  const getValidMembers = (members) => {
    return members.filter(
      (member) => member.status === "pending" || member.status === "accepted"
    );
  };

  // Dynamically render tabs based on user profile type
  const renderTabs = () => {
    const tabs = [
      { value: "invitations", label: "Project Invitations" },
      { value: "groups", label: "My Project Groups" },
    ];

    // Only add mentor invites tab if user is a mentor
    if (userProfileType === "mentor") {
      tabs.splice(1, 0, { value: "mentorInvites", label: "Mentor Invites" });
    }

    return tabs;
  };

  return (
    <div className="mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Projects</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {userProfileType !== null && (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            {renderTabs().map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="invitations">
            {loading && activeTab === "invitations" ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : invites.length === 0 && !error ? (
              <Card className="p-8 text-center text-gray-500">
                <p>No pending invitations</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {invites.map((invite) => (
                  <Card key={invite.id}>
                    <CardHeader>
                      <CardTitle>{invite.group.form.name}</CardTitle>
                      <CardDescription>
                        {invite.group.form.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">
                          Invited on:{" "}
                          {new Date(invite.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-x-2">
                        <Button
                          onClick={() =>
                            handleInviteResponse(
                              invite.group.id,
                              invite.id,
                              "rejected"
                            )
                          }
                          variant="outline"
                          disabled={processingInvites[invite.id]}
                        >
                          {processingInvites[invite.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          <span>Decline</span>
                        </Button>
                        <Button
                          onClick={() =>
                            handleInviteResponse(
                              invite.group.id,
                              invite.id,
                              "accepted"
                            )
                          }
                          disabled={processingInvites[invite.id]}
                        >
                          {processingInvites[invite.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          <span>Accept</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="mentorInvites">
            {loading && activeTab === "mentorInvites" ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : mentorInvites.length === 0 && !error ? (
              <Card className="p-8 text-center text-gray-500">
                <p>No pending mentor invitations</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {mentorInvites.map((invite) => (
                  <Card key={invite.id}>
                    <CardHeader>
                      <CardTitle>{invite.projectGroup.name}</CardTitle>
                      <CardDescription>
                        Mentor Invitation from {invite.requester.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {invite.message && (
                        <p className="text-sm text-gray-600 mb-4">
                          Message: {invite.message}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleMentorInviteResponse(invite.id, "rejected")
                        }
                        disabled={processingInvites[invite.id]}
                      >
                        {processingInvites[invite.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        <span>Decline</span>
                      </Button>
                      <Button
                        onClick={() =>
                          handleMentorInviteResponse(invite.id, "accepted")
                        }
                        disabled={processingInvites[invite.id]}
                      >
                        {processingInvites[invite.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        <span>Accept</span>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="groups">
            {loading && activeTab === "groups" ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : projectGroups.length === 0 && !error ? (
              <Card className="p-8 text-center text-gray-500">
                <p>You are not a member of any project groups</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectGroups.map((group) => (
                  <Card
                    key={group.id}
                    onClick={() => handleProjectGroupClick(group)}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <CardTitle>{group.form.name}</CardTitle>
                      <CardDescription>
                        {truncateText(group.form.description, 100)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-2">
                        <p className="text-sm text-gray-500">Group Members:</p>
                        <ul>
                          {getValidMembers(group.members).map((member) => (
                            <li
                              key={member.id}
                              className="flex items-center gap-2"
                            >
                              <span>{member.profile.name}</span>
                              {member.status === "pending" && (
                                <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                                  Pending
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProjectGroupClick(group);
                        }}
                      >
                        <span>View</span>
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ProjectPage;
