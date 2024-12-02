import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { scheduleMeeting, shareResource } from "@/actions/task";
import { toast } from "sonner";

export default function MentorActions({ groupId, onUpdate, tasks }) {
  const [reviewLoading, setReviewLoading] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState(null);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDesc, setMeetingDesc] = useState("");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [resource, setResource] = useState({
    name: "",
    url: "",
    type: "",
    description: "",
  });

  const handleScheduleMeeting = async () => {
    try {
      if (!meetingDate || !meetingTitle) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      await scheduleMeeting(groupId, {
        title: meetingTitle,
        scheduledFor: meetingDate,
        description: meetingDesc,
      });

      toast({
        title: "Success",
        description: "Team meeting scheduled successfully",
      });
      setMeetingDialogOpen(false);
      onUpdate?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule meeting",
        variant: "destructive",
      });
    }
  };

  const handleShareResource = async () => {
    try {
      if (!resource.name || !resource.url) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      await shareResource(groupId, resource);
      toast({
        title: "Success",
        description: "Resource shared successfully",
      });
      setResourceDialogOpen(false);
      onUpdate?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share resource",
        variant: "destructive",
      });
    }
  };

  // Filter tasks that are in review or in-progress status
  const reviewableTasks =
    tasks?.filter(
      (task) => task.status === "in-progress" || task.status === "todo"
    ) || [];

  return (
    <div className="flex space-x-2 mb-4">
      <Button variant="outline" onClick={() => setMeetingDialogOpen(true)}>
        Schedule Team Meeting
      </Button>

      <Button variant="outline" onClick={() => setResourceDialogOpen(true)}>
        Share Resources
      </Button>

      <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Team Meeting</DialogTitle>
            <DialogDescription>
              Set up a meeting with your team members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Meeting Title"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
            />
            <Textarea
              placeholder="Meeting Description"
              value={meetingDesc}
              onChange={(e) => setMeetingDesc(e.target.value)}
            />
            <Calendar
              mode="single"
              selected={meetingDate}
              onSelect={setMeetingDate}
              className="rounded-md border"
            />
            <Button onClick={handleScheduleMeeting}>Schedule Meeting</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Resource</DialogTitle>
            <DialogDescription>
              Share a helpful resource with your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Resource Name"
              value={resource.name}
              onChange={(e) =>
                setResource({ ...resource, name: e.target.value })
              }
            />
            <Input
              placeholder="Resource URL"
              value={resource.url}
              onChange={(e) =>
                setResource({ ...resource, url: e.target.value })
              }
            />
            <Input
              placeholder="Resource Type (e.g., article, video)"
              value={resource.type}
              onChange={(e) =>
                setResource({ ...resource, type: e.target.value })
              }
            />
            <Textarea
              placeholder="Resource Description"
              value={resource.description}
              onChange={(e) =>
                setResource({ ...resource, description: e.target.value })
              }
            />
            <Button onClick={handleShareResource}>Share Resource</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
