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
import { Ban, Lock } from "lucide-react";
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

  // Create a map of existing group members for quick lookup
  const existingMembers = useMemo(() => {
    if (!existingGroup) return new Map();
    return new Map(
      existingGroup.members.map((member) => [member.userId, member])
    );
  }, [existingGroup]);

  // Deduplicate submissions based on userId and identify owner
  const uniqueSubmissions = useMemo(() => {
    const userMap = new Map();

    const sortedSubmissions = [...submissions].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    sortedSubmissions.forEach((submission) => {
      if (!userMap.has(submission.userId)) {
        userMap.set(submission.userId, {
          ...submission,
          isOwner: submission.userId === existingGroup?.ownerId,
        });
      }
    });

    return Array.from(userMap.values());
  }, [submissions, existingGroup?.ownerId]);

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
    // Don't allow selection of existing members or owner
    if (
      existingMembers.has(userId) ||
      uniqueSubmissions.find((s) => s.userId === userId)?.isOwner
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
    if (!groupName.trim() || (selectedUsers.size === 0 && !existingGroup))
      return;

    setIsCreatingGroup(true);
    try {
      await createProjectGroup({
        formId,
        name: groupName,
        description: groupDescription,
        selectedMembers: Array.from(selectedUsers),
        groupId: existingGroup?.id,
      });

      setGroupName("");
      setGroupDescription("");
      setSelectedUsers(new Set());
      setIsGroupDialogOpen(false);
    } catch (error) {
      console.error("Error managing group:", error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!userToRemove) return;

    try {
      await updateGroupMember({
        groupId: existingGroup.id,
        userId: userToRemove,
        action: "remove",
      });
      setUserToRemove(null);
    } catch (error) {
      console.error("Error removing member:", error);
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
              disabled={selectedUsers.size === 0 && !existingGroup}
              className="ml-4"
            >
              {existingGroup ? "Update Group" : "Create Group"}
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
                  const isExistingMember = existingMembers.has(
                    submission.userId
                  );
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
                        <div className="flex items-center space-x-2">
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
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {profile?.skills.slice(0, 3).map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {profile?.skills.length > 3 && (
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
                          <Badge variant="secondary">
                            {submission.isOwner
                              ? "Owner"
                              : existingMembers.get(submission.userId).role}
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

      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {existingGroup ? "Update Project Group" : "Create Project Group"}
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
                {existingGroup ? (
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
                (!existingGroup && selectedUsers.size === 0) ||
                isCreatingGroup
              }
            >
              {isCreatingGroup
                ? "Processing..."
                : existingGroup
                ? "Update Group"
                : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!userToRemove}
        onOpenChange={() => setUserToRemove(null)}
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SubmissionGroupManager;
