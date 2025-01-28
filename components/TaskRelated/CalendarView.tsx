import React, { useMemo, useState, useCallback } from "react";
import {
  Calendar,
  momentLocalizer,
  Views,
  Navigate,
  NavigateAction,
  View,
} from "react-big-calendar";
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
import {
  Check,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";

const localizer = momentLocalizer(moment);

const STATUS_CONFIGS = {
  todo: {
    icon: <Clock className="mr-2 h-4 w-4" />,
    label: "To Do",
  },
  "in-progress": {
    icon: <Eye className="mr-2 h-4 w-4" />,
    label: "In Progress",
  },
  review: {
    icon: <AlertCircle className="mr-2 h-4 w-4" />,
    label: "Review",
  },
  completed: {
    icon: <Check className="mr-2 h-4 w-4" />,
    label: "Completed",
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
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<keyof typeof Views>("MONTH");

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
        start: task.dueDate ? new Date(task.dueDate) : new Date(),
        end: task.dueDate ? new Date(task.dueDate) : new Date(),
      }));
  }, [tasks, user]);

  // Custom date cell styling
  const dayPropGetter = useCallback((date: Date) => {
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const isCurrentMonth = date.getMonth() === today.getMonth();

    return {
      className: `
        rbc-day-cell 
        ${
          isToday
            ? "bg-white dark:bg-neutral-900 border-2 border-primary dark:border-primary rounded-full"
            : ""
        }
        ${
          !isCurrentMonth
            ? "text-neutral-400 dark:text-neutral-600 bg-neutral-50 dark:bg-neutral-900/50"
            : "text-neutral-800 dark:text-neutral-200"
        }
        hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors
      `,
    };
  }, []);

  // Custom event styling
  const eventStyleGetter = useCallback(
    (event: any) => ({
      className: `rbc-event rbc-event-custom rounded-md p-1 text-sm 
      ${event.status === "completed" ? "opacity-50" : "opacity-90"}
      ${
        event.status === "todo"
          ? "bg-neutral-200 text-neutral-800"
          : event.status === "in-progress"
          ? "bg-blue-100 text-blue-800"
          : event.status === "review"
          ? "bg-yellow-100 text-yellow-800"
          : "bg-green-100 text-green-800"
      }`,
    }),
    []
  );

  // Custom toolbar component
  const CustomToolbar = useCallback(
    ({
      label,
      onNavigate,
      onView,
    }: {
      label: string;
      onNavigate: (navigate: NavigateAction, date?: Date) => void;
      onView: (view: View) => void;
    }) => {
      return (
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center">
              <button
                onClick={() => onNavigate(Navigate.PREVIOUS)}
                className="hover:bg-neutral-100 dark:hover:bg-neutral-700 p-2 rounded-md transition-colors"
                title="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
                <button
                  onClick={() => onNavigate(Navigate.NEXT)}
                  className="hover:bg-neutral-100 dark:hover:bg-neutral-700 p-2 rounded-md transition-colors"
                  title="Next"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </button>
              <button
                onClick={() => onNavigate(Navigate.TODAY)}
                className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-sm"
              >
                <CalendarIcon className="h-4 w-4" />
                Today
              </button>
            </div>
          </div>

          <div className="text-xl font-semibold text-center sm:text-left w-full sm:w-auto">
            {label}
          </div>

          <div className="flex space-x-2 w-full sm:w-auto justify-center sm:justify-end overflow-x-auto">
            {Object.values(Views).map((viewOption) => (
              <button
                key={viewOption}
                onClick={() => onView(viewOption)}
                className={`px-2 sm:px-3 py-1 sm:py-2 rounded-md text-xs sm:text-sm transition-colors whitespace-nowrap
                ${
                  view.toLowerCase() === viewOption
                    ? "bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                }`}
              >
                {viewOption.charAt(0).toUpperCase() + viewOption.slice(1)}
              </button>
            ))}
          </div>
        </div>
      );
    },
    [view]
  );

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
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {selectedTask.title}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Due Date: {moment(selectedTask.dueDate).format("MMMM Do, YYYY")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Task Status */}
            <div className="flex items-center">
              <span className="flex items-center bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md text-xs sm:text-sm">
                {statusConfig.icon}
                {statusConfig.label}
              </span>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div>
                <h4 className="font-semibold text-xs sm:text-sm mb-2">
                  Description
                </h4>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                  {selectedTask.description}
                </p>
              </div>
            )}

            {/* Assignees */}
            <div>
              <h4 className="font-semibold text-xs sm:text-sm mb-2">
                Assigned To
              </h4>
              <div className="flex gap-2 flex-wrap">
                {selectedTask.assignedTo.map(
                  (assignee: { name: string; userId: string }) => (
                    <Badge
                      key={assignee.userId}
                      variant="secondary"
                      className="text-xs"
                    >
                      {assignee.name}
                    </Badge>
                  )
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
              {onTaskEdit && (
                <button
                  onClick={() => {
                    onTaskEdit(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className="flex items-center justify-center bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 px-3 py-2 rounded-md hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors text-xs sm:text-sm w-full sm:w-auto"
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Task
                </button>
              )}

              {onTaskStatusUpdate && (
                <div className="flex flex-wrap gap-2 w-full">
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
                          className="flex items-center justify-center flex-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-2 sm:px-3 py-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-xs sm:text-sm"
                        >
                          {config.icon}
                          {config.label}
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
      <div className="text-center text-neutral-500 py-10 text-sm sm:text-base">
        {!user
          ? "Please log in to view your tasks"
          : "No tasks assigned to you"}
      </div>
    );
  }

  return (
    <div className="h-[600px] sm:h-[600px] relative bg-white dark:bg-neutral-900 shadow-sm rounded-lg overflow-hidden">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={date}
        onNavigate={(newDate, view, action) => {
          // Ensure date is updated on navigation
          setDate(newDate);
        }}
        onView={(newView) => {
          // Update the view state
          setView(newView.toLowerCase() as keyof typeof Views);
        }}
        view={view}
        style={{ height: "100%" }}
        eventStyleGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
        views={["month", "week", "day"]}
        components={{
          toolbar: CustomToolbar,
        }}
        onSelectEvent={handleSelectEvent}
        tooltipAccessor={(event) =>
          `${event.title}\nStatus: ${
            STATUS_CONFIGS[event.status as keyof typeof STATUS_CONFIGS]?.label
          }`
        }
        // Add mobile-specific props
        popup
        selectable
        longPressThreshold={50}
      />
      {renderTaskDetailsDialog()}
    </div>
  );
};

export default CalendarView;
