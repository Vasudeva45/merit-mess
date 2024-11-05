"use client";

import React, { useState } from "react";
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
import { createProjectGroup } from "@/actions/group";

const SubmissionGroupManager = ({ formId, submissions }) => {
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const handleUserSelection = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.size === 0) return;

    setIsCreatingGroup(true);
    try {
      await createProjectGroup({
        formId,
        name: groupName,
        description: groupDescription,
        selectedMembers: Array.from(selectedUsers),
      });

      // Reset form and close dialog
      setGroupName("");
      setGroupDescription("");
      setSelectedUsers(new Set());
      setIsGroupDialogOpen(false);
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Form Submissions</span>
            <Button
              onClick={() => setIsGroupDialogOpen(true)}
              disabled={selectedUsers.size === 0}
              className="ml-4"
            >
              Create Group ({selectedUsers.size} selected)
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
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(submission.userId)}
                        onCheckedChange={() =>
                          handleUserSelection(submission.userId)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {submission.profile?.name}
                        </span>
                        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {submission.profile?.bio}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {submission.profile?.skills.slice(0, 3).map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {submission.profile?.skills.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{submission.profile.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {submission.profile?.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(submission.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project Group</DialogTitle>
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
                Selected members: {selectedUsers.size}
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
              onClick={handleCreateGroup}
              disabled={
                !groupName.trim() || selectedUsers.size === 0 || isCreatingGroup
              }
            >
              {isCreatingGroup ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubmissionGroupManager;
