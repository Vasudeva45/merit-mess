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

const TaskEditRoom = ({ task, isOpen, onClose, members, onUpdate }) => {
  const [status, setStatus] = useState(task?.status || "todo");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [assignees, setAssignees] = useState(
    task?.assignedTo?.map((user) => user.userId) || []
  );
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState(task?.description || "");
  const [date, setDate] = useState(
    task?.dueDate ? new Date(task.dueDate) : null
  );

  const StatusIcon = TASK_STATUS[status]?.icon || Circle;

  const handleUpdate = async (updateData) => {
    try {
      setLoading(true);
      await updateTask(task.id, updateData);
      onUpdate();
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    await handleUpdate({ status: newStatus });
  };

  const handlePriorityChange = async (newPriority) => {
    setPriority(newPriority);
    await handleUpdate({ priority: newPriority });
  };

  const handleDescriptionSave = async () => {
    setIsEditingDesc(false);
    await handleUpdate({ description });
    onUpdate();
    setDescription(description); // Update local state with the new value
  };

  const handleDateChange = async (newDate) => {
    setDate(newDate);
    await handleUpdate({ dueDate: newDate });
  };

  const handleAssigneesChange = async (userId) => {
    const newAssignees = assignees.includes(userId)
      ? assignees.filter((id) => id !== userId)
      : [...assignees, userId];

    setAssignees(newAssignees);
    await handleUpdate({ assigneeIds: newAssignees });
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setLoading(true);
      await addComment({
        content: newComment,
        taskId: task.id,
      });
      setNewComment("");
      onUpdate();
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <div className="flex-1 overflow-hidden flex">
            {/* Left Panel */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Description */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Description</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      isEditingDesc
                        ? handleDescriptionSave()
                        : setIsEditingDesc(true)
                    }
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

                <div className="space-y-4">
                  {task?.comments?.map((comment, index) => (
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
                  ))}
                </div>

                <form onSubmit={handleCommentSubmit} className="flex gap-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={loading || !newComment.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>

            {/* Right Panel */}
            <div className="w-80 border-l p-6 space-y-6">
              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_STATUS).map(
                      ([value, { label, icon: Icon }]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <Icon
                              className={`h-4 w-4 ${TASK_STATUS[value].color}`}
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
                <Select value={priority} onValueChange={handlePriorityChange}>
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
                  onValueChange={handleAssigneesChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {members?.map((member) => (
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
                  {task?.assignedTo?.map((user) => (
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
                        onClick={() => handleAssigneesChange(user.userId)}
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
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {date ? format(date, "PPP") : "Set due date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarUI
                      mode="single"
                      selected={date}
                      onSelect={handleDateChange}
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
  );
};

export default TaskEditRoom;
