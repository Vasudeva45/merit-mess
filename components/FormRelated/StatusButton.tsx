"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LuSettings } from "react-icons/lu";
import { Loader2 } from "lucide-react";
import { UpdateFormStatus } from "@/actions/form";
import CustomToast from "@/components/Toast/custom-toast";

export const StatusButton = ({
  status: initialStatus,
  formId,
}: {
  status: string;
  formId: number;
}) => {
  const statuses = ["draft", "active", "closed"];
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: { title: string; details: string };
  } | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    try {
      await UpdateFormStatus(formId, newStatus);
      setStatus(newStatus);
      setToast({
        type: "success",
        message: {
          title: "Status Updated Successfully",
          details: `Form status changed to ${newStatus.toUpperCase()}`,
        },
      });
    } catch (error) {
      setToast({
        type: "error",
        message: {
          title: "Status Update Failed",
          details: (error as any)?.message || "Failed to update form status",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LuSettings className="h-4 w-4" />
            )}
            Status: {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {statuses.map((s) => (
            <DropdownMenuItem
              key={s}
              className="capitalize"
              disabled={s === status || isLoading}
              onClick={() => handleStatusChange(s)}
            >
              {s}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {toast && (
        <CustomToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

// FormLinkShare component with toast notification
export const FormLinkShare = ({ shareURL }: { shareURL: string }) => {
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: { title: string; details: string };
  } | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareURL);
      setToast({
        type: "success",
        message: {
          title: "Link Copied",
          details: "Form link has been copied to clipboard",
        },
      });
    } catch (error) {
      setToast({
        type: "error",
        message: {
          title: "Copy Failed",
          details: "Failed to copy form link to clipboard",
        },
      });
    }
  };

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={handleCopy}>
        Copy Link
      </Button>

      {toast && (
        <CustomToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};
