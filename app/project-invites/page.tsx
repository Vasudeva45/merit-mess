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
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";

const ProjectPage = () => {
  const [invites, setInvites] = useState([]);
  const [projectGroups, setProjectGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingInvites, setProcessingInvites] = useState({});
  const [activeTab, setActiveTab] = useState("invitations");
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "invitations") {
        const invitesData = await getProjectInvites();
        // Filter out invites where the user's status is 'accepted'
        setInvites(
          invitesData.filter((invite) => invite.status !== "accepted")
        );
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

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const response = await fetch("/api/project-invites");
      if (!response.ok) throw new Error("Failed to fetch invites");
      const data = await response.json();
      setInvites(data);
    } catch (err) {
      setError("Failed to load project invitations");
    } finally {
      setLoading(false);
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

      // Remove the processed invite from the list
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

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Projects</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="invitations">Project Invitations</TabsTrigger>
          <TabsTrigger value="groups">My Project Groups</TabsTrigger>
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
            <div className="space-y-4">
              {projectGroups.map((group) => (
                <Card
                  key={group.id}
                  onClick={() => router.push(`/projects/${group.id}`)}
                >
                  <CardHeader>
                    <CardTitle>{group.form.name}</CardTitle>
                    <CardDescription>{group.form.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2">
                      <p className="text-sm text-gray-500">Group Members:</p>
                      <ul>
                        {group.members.map((member) => (
                          <li key={member.id}>{member.profile.name}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectPage;
