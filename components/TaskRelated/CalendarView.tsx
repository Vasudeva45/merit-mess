import React, { useMemo, useState } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useUser } from "@auth0/nextjs-auth0/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, AlertCircle, Eye, Edit } from "lucide-react";

// Initialize the localizer
const localizer = momentLocalizer(moment);

// Status color and icon mapping
const STATUS_CONFIGS = {
  todo: {
    color: "bg-gray-200 text-gray-800",
    icon: <Clock className="mr-2 h-4 w-4" />,
  },
  "in-progress": {
    color: "bg-yellow-200 text-yellow-800",
    icon: <Eye className="mr-2 h-4 w-4" />,
  },
  review: {
    color: "bg-blue-200 text-blue-800",
    icon: <AlertCircle className="mr-2 h-4 w-4" />,
  },
  completed: {
    color: "bg-green-200 text-green-800",
    icon: <Check className="mr-2 h-4 w-4" />,
  },
};

interface CalendarViewProps {
  tasks: Array<{
    id: number;
    title: string;
    description?: string;
    dueDate?: Date;
    status: string;
    priority?: string;
    assignedTo: Array<{ name: string; userId: string }>;
  }>;
  onTaskEdit?: (taskId: number) => void;
  onTaskStatusUpdate?: (taskId: number, status: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onTaskEdit,
  onTaskStatusUpdate,
}) => {
  const { user } = useUser();
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Transform tasks into calendar events, filtering for the current user
  const events = useMemo(() => {
    return tasks
      .filter((task) => {
        if (!user) return false;
        return (
          task.dueDate &&
          task.assignedTo.some((assignee) => assignee.userId === user.sub)
        );
      })
      .map((task) => ({
        ...task,
        start: new Date(task.dueDate),
        end: new Date(task.dueDate),
      }));
  }, [tasks, user]);

  // Custom event styling
  const eventStyleGetter = (event: any) => {
    const statusConfig =
      STATUS_CONFIGS[event.status as keyof typeof STATUS_CONFIGS] ||
      STATUS_CONFIGS.todo;
    return {
      className: `${statusConfig.color} rounded-md p-1 opacity-90`,
    };
  };

  // Handle event selection
  const handleSelectEvent = (event: any) => {
    setSelectedTask(event);
  };

  // Render task details dialog
  const renderTaskDetailsDialog = () => {
    if (!selectedTask) return null;

    const statusConfig =
      STATUS_CONFIGS[selectedTask.status as keyof typeof STATUS_CONFIGS] ||
      STATUS_CONFIGS.todo;

    return (
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedTask.title}</DialogTitle>
            <DialogDescription>Task Details and Actions</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Task Status */}
            <div className="flex items-center">
              <span
                className={`flex items-center ${statusConfig.color} px-2 py-1 rounded-md`}
              >
                {statusConfig.icon}
                {selectedTask.status.replace("-", " ")}
              </span>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Description</h4>
                <p className="text-sm text-gray-600">
                  {selectedTask.description}
                </p>
              </div>
            )}

            {/* Assignees */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Assigned To</h4>
              <div className="flex gap-2">
                {selectedTask.assignedTo.map((assignee) => (
                  <Badge key={assignee.userId} variant="secondary">
                    {assignee.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between space-x-2 mt-4">
              {onTaskEdit && (
                <button
                  onClick={() => {
                    onTaskEdit(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className="flex items-center bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600"
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Task
                </button>
              )}

              {onTaskStatusUpdate && (
                <div className="flex space-x-2">
                  {Object.keys(STATUS_CONFIGS)
                    .filter((status) => status !== selectedTask.status)
                    .map((status) => {
                      const config =
                        STATUS_CONFIGS[status as keyof typeof STATUS_CONFIGS];
                      return (
                        <button
                          key={status}
                          onClick={() => {
                            onTaskStatusUpdate(selectedTask.id, status);
                            setSelectedTask(null);
                          }}
                          className={`flex items-center ${config.color} px-3 py-2 rounded-md hover:opacity-80`}
                        >
                          {config.icon}
                          {status.replace("-", " ")}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // If no tasks or no user, show a message
  if (!user || events.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">
        {!user
          ? "Please log in to view your tasks"
          : "No tasks assigned to you"}
      </div>
    );
  }

  return (
    <div className="h-[600px] relative">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        eventStyleGetter={eventStyleGetter}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        defaultView={Views.MONTH}
        onSelectEvent={handleSelectEvent}
        tooltipAccessor={(event) => `${event.title}\nStatus: ${event.status}`}
      />
      {renderTaskDetailsDialog()}
    </div>
  );
};

export default CalendarView;
