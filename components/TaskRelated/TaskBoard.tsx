"use client";

import React, { useState } from "react";
import { createTask, updateTaskStatus } from "@/actions/task";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import TaskEditRoom from "./TaskEditRoom";

const TASK_STATUS = {
  todo: { label: "To Do", icon: Circle, color: "text-gray-500" },
  "in-progress": { label: "In Progress", icon: Timer, color: "text-blue-500" },
  review: { label: "Review", icon: AlertCircle, color: "text-yellow-500" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-green-500" },
};

const TaskBoard = ({ tasks = [], members = [], groupId, onUpdate }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [taskData, setTaskData] = useState(tasks);
  const [isLoading, setIsLoading] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    assigneeIds: "",
  });

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        assigneeIds: newTask.assigneeIds ? [newTask.assigneeIds] : [],
      };

      const createdTask = await createTask(groupId, taskData);

      setTaskData((prevTasks) => [
        ...prevTasks,
        { ...createdTask, status: "todo" },
      ]);

      setIsCreateOpen(false);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        assigneeIds: "",
      });

      onUpdate();
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
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

      await updateTaskStatus(taskId, newStatus);
      onUpdate();
    } catch (error) {
      console.error("Failed to update task status:", error);
    } finally {
      setTaskData((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, isLoading: false } : task
        )
      );
    }
  };

  const groupedTasks = taskData.reduce((acc, task) => {
    const status = task.status || "todo";
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {});

  return (
    <div className="space-y-4 p-4 sm:p-6">
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

const TaskCard = ({ task, onStatusChange, members }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <Card
        className="p-3 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setIsEditOpen(true)}
      >
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row justify-between items-start space-y-2 sm:space-y-0">
            <h3 className="font-medium w-full sm:w-auto">{task.title}</h3>
            <Select
              value={task.status}
              onValueChange={(value) => onStatusChange(task.id, value)}
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
          </div>
          {task.description && (
            <p className="text-sm text-gray-500">{task.description}</p>
          )}
          {task.assignedTo?.length > 0 && (
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

      <TaskEditRoom
        task={task}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        members={members}
        onUpdate={onStatusChange}
      />
    </>
  );
};

export default TaskBoard;
