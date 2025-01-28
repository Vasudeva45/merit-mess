"use client";

import React, { useState, useEffect } from "react";
import { createTask, updateTaskStatus, deleteTask } from "@/actions/task";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Plus,
  AlertCircle,
  CheckCircle2,
  Circle,
  Timer,
  Loader2,
  Zap,
  Trash2,
} from "lucide-react";
import TaskEditRoom from "./TaskEditRoom";
import CustomToast, { ToastMessage } from "../Toast/custom-toast";

const TASK_STATUS = {
  todo: { label: "To Do", icon: Circle, color: "text-gray-500" },
  "in-progress": { label: "In Progress", icon: Timer, color: "text-blue-500" },
  review: { label: "Review", icon: AlertCircle, color: "text-yellow-500" },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-500",
  },
};

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  assigneeIds: string[];
  status: string;
  isLoading?: boolean;
  assignedTo?: { userId: string; name: string }[];
}

const TaskBoard = ({
  tasks = [],
  members = [],
  groupId,
}: {
  tasks: Task[];
  members: any[];
  groupId: string;
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [taskData, setTaskData] = useState(tasks);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: ToastMessage;
    type: "success" | "error";
  } | null>(null);
  const [activeTaskEdit, setActiveTaskEdit] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    assigneeIds: "",
  });

  const showToast = (message: ToastMessage, type: "success" | "error") => {
    if (!activeTaskEdit) {
      setToast({ message, type });
    }
  };

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        assigneeIds: newTask.assigneeIds ? [newTask.assigneeIds] : [],
      };

      const createdTask = await createTask(Number(groupId), taskData);

      setTaskData((prevTasks) => [
        ...prevTasks,
        {
          ...createdTask,
          id: createdTask.id.toString(),
          status: "todo",
          assigneeIds: createdTask.assignedTo
            ? createdTask.assignedTo.map((assignee) => assignee.userId)
            : [],
          description: createdTask.description || "",
        },
      ]);

      setIsCreateOpen(false);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        assigneeIds: "",
      });
      const deleteTask = async (taskId: string) => {
        try {
          await deleteTask(taskId);
        } catch (error) {
          console.error("Error deleting task:", error);
          throw new Error("Failed to delete task");
        }
      };

      showToast(
        {
          title: "Task Created",
          details: `Successfully created task: ${createdTask.title}`,
        },
        "success"
      );
    } catch (error) {
      console.error("Failed to create task:", error);
      showToast(
        {
          title: "Error Creating Task",
          details: "Failed to create task. Please try again.",
        },
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTaskData((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  const handleStatusChange = async (
    taskId: string,
    newStatus: keyof typeof TASK_STATUS
  ) => {
    if (!taskId) {
      console.error("Task ID is required for status update");
      showToast(
        {
          title: "Error Updating Status",
          details: "Invalid task ID. Please try again.",
        },
        "error"
      );
      return;
    }

    if (activeTaskEdit) {
      try {
        await updateTaskStatus(Number(taskId), newStatus);
      } catch (error) {
        console.error("Failed to update task status:", error);
      }
      return;
    }

    setTaskData((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, isLoading: true } : task
      )
    );

    try {
      setTaskData((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );

      await updateTaskStatus(Number(taskId), newStatus);

      const updatedTask = taskData.find((task) => task.id === taskId);
      if (!updatedTask) {
        throw new Error("Task not found");
      }

      showToast(
        {
          title: "Status Updated",
          details: `Task "${updatedTask.title}" moved to ${TASK_STATUS[newStatus].label}`,
        },
        "success"
      );
    } catch (error) {
      console.error("Failed to update task status:", error);
      showToast(
        {
          title: "Error Updating Status",
          details: "Failed to update task status. Please try again.",
        },
        "error"
      );

      setTaskData((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: task.status } : task
        )
      );
    } finally {
      setTaskData((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, isLoading: false } : task
        )
      );
    }
  };

  const handleDelete = async (taskId: string) => {
    const taskToDelete = taskData.find((task) => task.id === taskId);
    if (!taskToDelete) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the task: "${taskToDelete.title}"?`
    );
    if (!confirmed) return;

    try {
      await deleteTask(Number(taskId));
      setTaskData((prevTasks) =>
        prevTasks.filter((task) => task.id !== taskId)
      );
      showToast(
        {
          title: "Task Deleted",
          details: `Successfully deleted task: ${taskToDelete.title}`,
        },
        "success"
      );
    } catch (error) {
      console.error("Error deleting task:", error);
      showToast(
        {
          title: "Error Deleting Task",
          details: "Failed to delete task. Please try again.",
        },
        "error"
      );
    }
  };

  const groupedTasks = taskData.reduce<Record<string, Task[]>>((acc, task) => {
    const status = task.status || "todo";
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {});

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {toast && !activeTaskEdit && (
        <CustomToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold w-full">Tasks</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, priority: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Assignees</label>
                <Select
                  value={newTask.assigneeIds}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, assigneeIds: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {members
                      .filter((member) => member.role !== "mentor")
                      .map((member) => (
                        <SelectItem
                          key={member.profile.userId}
                          value={member.profile.userId}
                        >
                          {member.profile.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Create Task
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(TASK_STATUS).map(([status, { label, icon: Icon }]) => (
          <Card key={status}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Icon className="h-4 w-4 mr-2" />
                {label} ({groupedTasks[status]?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groupedTasks[status]?.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    members={members}
                    setActiveTaskEdit={setActiveTaskEdit}
                    onTaskUpdate={handleTaskUpdate}
                    onDeleteTask={handleDelete} // Pass handleDelete function here
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: keyof typeof TASK_STATUS) => void;
  members: any[];
  setActiveTaskEdit: (taskId: string | null) => void;
  onTaskUpdate: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

// Update the TaskCard component's delete button handler:
const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  members,
  setActiveTaskEdit,
  onTaskUpdate,
  onDeleteTask,
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteTask(task.id);
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setShowDeleteDialog(false);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        className="p-3 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setIsEditOpen(true)}
      >
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row justify-between items-start space-y-2 sm:space-y-0">
            <h3 className="font-medium w-full sm:w-auto">{task.title}</h3>
            <div className="flex items-center space-x-2">
              <Select
                value={task.status}
                onValueChange={(value) =>
                  onStatusChange(task.id, value as keyof typeof TASK_STATUS)
                }
                disabled={task.isLoading}
              >
                <SelectTrigger className="h-6 w-full sm:w-24">
                  {task.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SelectValue />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_STATUS).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleDeleteClick}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                ) : (
                  <Trash2 className="h-4 w-4 text-red-500" />
                )}
              </Button>
            </div>
          </div>
          {task.description && (
            <p className="text-sm text-gray-500">{task.description}</p>
          )}
          {task.assignedTo && task.assignedTo.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 text-xs text-gray-500">
              <span>Assigned to:</span>
              <div className="flex flex-wrap gap-1">
                {task.assignedTo.map((user) => (
                  <span key={user.userId} className="font-medium">
                    {user.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete this task?</p>
              <div className="bg-muted p-3 rounded-md mt-2">
                <p className="font-medium">{task.title}</p>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {task.description}
                  </p>
                )}
                {task.assignedTo && task.assignedTo.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Assigned to:{" "}
                    {task.assignedTo.map((user) => user.name).join(", ")}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TaskEditRoom
        task={task}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setActiveTaskEdit(null);
        }}
        members={members}
        onUpdate={onTaskUpdate}
      />
    </>
  );
};

export default TaskBoard;
