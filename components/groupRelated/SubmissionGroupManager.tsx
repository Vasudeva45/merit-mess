"use client";

import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { createProjectGroup, updateGroupMember } from "@/actions/group";
import { Ban, Lock, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getProfilesByIds } from "@/actions/profile";
import CustomToast from "../Toast/custom-toast";

const SubmissionGroupManager = ({
  formId,
  submissions,
  existingGroup = null,
}) => {
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState(existingGroup?.name || "");
  const [groupDescription, setGroupDescription] = useState(
    existingGroup?.description || ""
  );
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);
  const [toast, setToast] = useState(null);
  const [currentGroup, setCurrentGroup] = useState(existingGroup);
  const [localSubmissions, setLocalSubmissions] = useState(submissions);
  const [isRemoving, setIsRemoving] = useState(false);

  // Create a map of existing group members for quick lookup
  const existingMembers = useMemo(() => {
    if (!currentGroup) return new Map();
    return new Map(
      currentGroup.members.map((member) => [member.userId, member])
    );
  }, [currentGroup]);

  // Deduplicate submissions based on userId and identify owner
  const uniqueSubmissions = useMemo(() => {
    const userMap = new Map();
    const sortedSubmissions = [...localSubmissions].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    sortedSubmissions.forEach((submission) => {
      if (!userMap.has(submission.userId)) {
        userMap.set(submission.userId, {
          ...submission,
          isOwner: submission.userId === currentGroup?.ownerId,
        });
      }
    });

    return Array.from(userMap.values());
  }, [localSubmissions, currentGroup?.ownerId]);

  const [profiles, setProfiles] = useState({});
  const userIds = useMemo(
    () => uniqueSubmissions.map((s) => s.userId),
    [uniqueSubmissions]
  );

  React.useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const fetchedProfiles = await getProfilesByIds(userIds);
        const profileMap = fetchedProfiles.reduce((acc, profile) => {
          acc[profile.userId] = profile;
          return acc;
        }, {});
        setProfiles(profileMap);
      } catch (error) {
        console.error("Error fetching profiles:", error);
      }
    };

    fetchProfiles();
  }, [userIds]);

  const handleUserSelection = (userId) => {
    const member = existingMembers.get(userId);
    if (
      existingMembers.has(userId) ||
      uniqueSubmissions.find((s) => s.userId === userId)?.isOwner ||
      member?.status === "rejected"
    )
      return;

    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleCreateOrUpdateGroup = async () => {
    if (!groupName.trim() || (selectedUsers.size === 0 && !currentGroup))
      return;

    setIsCreatingGroup(true);
    try {
      const updatedGroup = await createProjectGroup({
        formId,
        name: groupName,
        description: groupDescription,
        selectedMembers: Array.from(selectedUsers),
        groupId: currentGroup?.id,
      });

      setCurrentGroup(updatedGroup);
      setSelectedUsers(new Set());
      setIsGroupDialogOpen(false);

      setToast({
        type: "success",
        message: {
          title: currentGroup
            ? "Group Updated Successfully"
            : "Group Created Successfully",
          details: `Group: ${groupName} • Members: ${selectedUsers.size} • Form ID: ${formId}`,
        },
      });
    } catch (error) {
      setToast({
        type: "error",
        message: {
          title: "Group Operation Failed",
          details: `Error: ${
            error?.message || "Unknown error occurred"
          } • Form ID: ${formId}`,
        },
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!userToRemove) return;

    setIsRemoving(true);
    try {
      await updateGroupMember({
        groupId: currentGroup.id,
        userId: userToRemove,
        action: "remove",
      });

      setCurrentGroup((prev) => ({
        ...prev,
        members: prev.members.filter(
          (member) => member.userId !== userToRemove
        ),
      }));

      setToast({
        type: "success",
        message: {
          title: "Member Removed Successfully",
          details: `from the group`,
        },
      });
    } catch (error) {
      setToast({
        type: "error",
        message: {
          title: "Member Removal Failed",
          details: `Error: ${
            error?.message || "Unknown error occurred"
          } • Group ID: ${currentGroup.id}`,
        },
      });
    } finally {
      setIsRemoving(false);
      setUserToRemove(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span>Form Submissions</span>
              <Badge variant="secondary" className="text-xs">
                {uniqueSubmissions.length} unique users
              </Badge>
            </div>
            <Button
              onClick={() => setIsGroupDialogOpen(true)}
              disabled={selectedUsers.size === 0 && !currentGroup}
              className="ml-4"
            >
              {currentGroup ? "Update Group" : "Create Group"}
              {selectedUsers.size > 0 && ` (${selectedUsers.size} selected)`}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Latest Submission</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uniqueSubmissions.map((submission) => {
                  const existingMember = existingMembers.get(submission.userId);
                  const isExistingMember = !!existingMember;
                  const isRejected = existingMember?.status === "rejected";
                  const profile = profiles[submission.userId];

                  return (
                    <TableRow
                      key={submission.userId}
                      className="hover:bg-muted/50"
                    >
                      <TableCell>
                        {submission.isOwner ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled
                            className="text-muted-foreground"
                            title="Form owner cannot be removed"
                          >
                            <Lock className="w-4 h-4" />
                          </Button>
                        ) : isRejected ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled
                            className="text-muted-foreground"
                            title="Rejected member"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        ) : isExistingMember ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setUserToRemove(submission.userId)}
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Checkbox
                            checked={selectedUsers.has(submission.userId)}
                            onCheckedChange={() =>
                              handleUserSelection(submission.userId)
                            }
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <a
                          href={`/publicprofile/${encodeURIComponent(
                            submission.userId
                          )}`}
                          className="flex items-center space-x-2 hover:text-primary transition-colors"
                        >
                          <img
                            src={profile?.imageUrl || "/placeholder.png"}
                            alt={profile?.name || ""}
                            className="h-8 w-8 rounded-full"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {profile?.name}
                              {submission.isOwner && (
                                <Badge
                                  variant="secondary"
                                  className="ml-2 text-xs"
                                >
                                  Owner
                                </Badge>
                              )}
                            </span>
                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {profile?.bio}
                            </span>
                          </div>
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {profile?.skills?.slice(0, 3).map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {profile?.skills?.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{profile.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{profile?.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(submission.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {(isExistingMember || submission.isOwner) && (
                          <Badge
                            variant={isRejected ? "destructive" : "secondary"}
                          >
                            {submission.isOwner
                              ? "Owner"
                              : isRejected
                              ? "Rejected"
                              : existingMember.role}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {uniqueSubmissions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-4 text-muted-foreground"
                    >
                      No submissions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {toast && (
        <CustomToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Loading overlay */}
      {isRemoving && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">Removing member...</p>
          </div>
        </div>
      )}

      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentGroup ? "Update Project Group" : "Create Project Group"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Name</label>
              <Input
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Enter group description"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {currentGroup ? (
                  <>
                    Current members: {existingMembers.size}
                    {selectedUsers.size > 0 && ` (${selectedUsers.size} new)`}
                  </>
                ) : (
                  `Selected members: ${selectedUsers.size}`
                )}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGroupDialogOpen(false)}
              disabled={isCreatingGroup}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrUpdateGroup}
              disabled={
                !groupName.trim() ||
                (!currentGroup && selectedUsers.size === 0) ||
                isCreatingGroup
              }
            >
              {isCreatingGroup
                ? "Processing..."
                : currentGroup
                ? "Update Group"
                : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!userToRemove}
        onOpenChange={(open) => !isRemoving && setUserToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Group Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the group? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SubmissionGroupManager;
