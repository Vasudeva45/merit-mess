import React, { useState } from "react";
import { updateTask, addComment } from "@/actions/task";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import CustomToast, { ToastMessage } from "@/components/Toast/custom-toast";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Timer,
  Send,
  Calendar,
  Edit2,
  Save,
  X,
  Flag,
  MessageSquare,
  Loader2,
  Zap,
} from "lucide-react";
import { format } from "date-fns";

const TASK_STATUS = {
  todo: { label: "To Do", icon: Circle, color: "text-gray-500 bg-gray-100" },
  "in-progress": {
    label: "In Progress",
    icon: Timer,
    color: "text-blue-500 bg-blue-100",
  },
  review: {
    label: "Review",
    icon: AlertCircle,
    color: "text-yellow-500 bg-yellow-100",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-500 bg-green-100",
  },
};

const PRIORITY_OPTIONS = {
  low: { label: "Low", color: "text-gray-500 bg-gray-100" },
  medium: { label: "Medium", color: "text-yellow-500 bg-yellow-100" },
  high: { label: "High", color: "text-red-500 bg-red-100" },
};

interface TaskEditRoomProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
  members: any[];
  onUpdate: (updatedTask: any) => void;
}

const TaskEditRoom: React.FC<TaskEditRoomProps> = ({
  task,
  isOpen,
  onClose,
  members,
  onUpdate,
}) => {
  // Local state for tracking changes
  const [status, setStatus] = useState<keyof typeof TASK_STATUS>(
    task?.status || "todo"
  );
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [assignees, setAssignees] = useState(
    task?.assignedTo?.map((user: { userId: string }) => user.userId) || []
  );
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState(task?.description || "");
  const [date, setDate] = useState(task?.dueDate ? new Date(task.dueDate) : null);

  const [toast, setToast] = useState<{
    message: ToastMessage;
    type: "success" | "error";
  } | null>(null);

  const StatusIcon = TASK_STATUS[status]?.icon || Circle;

  const showToast = (
    title: string,
    details: string,
    type: "success" | "error"
  ) => {
    setToast({
      message: { title, details },
      type,
    });
  };

  // Handle saving all changes at once
  const handleSave = async () => {
    try {
      setLoading(true);

      // Prepare the update data
      const updateData = {
        status,
        priority,
        description,
        dueDate: date || undefined,
        assigneeIds: assignees,
      };

      // Call the update API
      const updatedTask = await updateTask(task.id, updateData);

      // Notify parent component of the update
      onUpdate(updatedTask);

      // Show success toast
      showToast("Task Updated", "All changes were saved successfully.", "success");
    } catch (error) {
      console.error("Failed to update task:", error);
      showToast(
        "Update Failed",
        error instanceof Error ? error.message : "Failed to update task",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a comment (still saved immediately)
  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setLoading(true);

      // Add the comment
      const addedComment = await addComment({
        content: newComment,
        taskId: task.id,
      });

      // Update the task comments
      onUpdate({
        ...task,
        comments: [...task.comments, addedComment],
      });

      // Clear the comment input
      setNewComment("");

      // Show success toast
      showToast("Comment Added", "Your comment was successfully added.", "success");
    } catch (error) {
      console.error("Failed to add comment:", error);
      showToast(
        "Comment Failed",
        error instanceof Error ? error.message : "Failed to add comment",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[90vh] p-0">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon
                    className={`h-8 w-8 p-1.5 rounded-full ${TASK_STATUS[status].color}`}
                  />
                  <h2 className="text-2xl font-semibold">{task?.title}</h2>
                </div>
                
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left Panel */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Description */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Description</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingDesc(!isEditingDesc)}
                      disabled={loading}
                    >
                      {isEditingDesc ? (
                        <Save className="h-4 w-4 mr-2" />
                      ) : (
                        <Edit2 className="h-4 w-4 mr-2" />
                      )}
                      {isEditingDesc ? "Save" : "Edit"}
                    </Button>
                  </div>
                  {isEditingDesc ? (
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[200px]"
                      placeholder="Add a detailed description..."
                      disabled={loading}
                    />
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      {description || (
                        <p className="text-gray-500 italic">
                          No description provided
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Comments */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <h3 className="text-lg font-medium">Comments</h3>
                  </div>
                  <div className="space-y-4 max-h-40 overflow-y-auto p-2 border rounded-md custom-scrollbar">
                    {task?.comments?.map(
                      (
                        comment: {
                          author: { name: string };
                          createdAt: string;
                          content: string;
                        },
                        index: number
                      ) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                                {comment.author.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {comment.author.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                  <form onSubmit={handleCommentSubmit} className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1"
                      disabled={loading}
                    />
                    <Button type="submit" disabled={loading || !newComment.trim()}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
                <Button onClick={handleSave} disabled={loading} className="w-full">
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>

              {/* Right Panel */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l p-6 space-y-6">
                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={status}
                    onValueChange={(value: keyof typeof TASK_STATUS) =>
                      setStatus(value)
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TASK_STATUS).map(
                        ([value, { label, icon: Icon }]) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              <Icon
                                className={`h-4 w-4 ${TASK_STATUS[value as keyof typeof TASK_STATUS].color}`}
                              />
                              {label}
                            </div>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={priority}
                    onValueChange={(value: keyof typeof PRIORITY_OPTIONS) =>
                      setPriority(value)
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_OPTIONS).map(
                        ([value, { label, color }]) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              <Flag className={`h-4 w-4 ${color}`} />
                              {label}
                            </div>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignees */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assignees</label>
                  <Select
                    value={assignees[assignees.length - 1] || ""}
                    onValueChange={(userId: string) => {
                      const newAssignees = assignees.includes(userId)
                        ? assignees.filter((id: string) => id !== userId)
                        : [...assignees, userId];
                      setAssignees(newAssignees);
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {members
                        ?.filter((member) => member.role !== "mentor")
                        .map((member) => (
                          <SelectItem
                            key={member.profile.userId}
                            value={member.profile.userId}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{member.profile.name}</span>
                              {assignees.includes(member.profile.userId) && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <div className="mt-2 space-y-2">
                    {task?.assignedTo
                      ?.filter((user: { userId: string }) => {
                        return task.assignedTo.length > 1
                          ? user.userId !== task.mentorId
                          : true;
                      })
                      .map((user: { userId: string; name: string }) => (
                        <div
                          key={user.userId}
                          className="flex items-center gap-2 p-2 rounded-md bg-secondary/20"
                        >
                          <div className="h-6 w-6 bg-primary/10 rounded-full flex items-center justify-center text-sm">
                            {user.name.charAt(0)}
                          </div>
                          <span className="text-sm">{user.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto p-0 h-6 w-6"
                            onClick={() =>
                              setAssignees(
                                assignees.filter((id: string) => id !== user.userId)
                              )
                            }
                            disabled={loading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        disabled={loading}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {date ? format(date, "PPP") : "Set due date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <CalendarUI
                        mode="single"
                        selected={date || undefined}
                        onSelect={(newDate) => setDate(newDate || null)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Created Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Created</label>
                  <div className="text-sm text-gray-600">
                    {new Date(task?.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {toast && (
        <CustomToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default TaskEditRoom;