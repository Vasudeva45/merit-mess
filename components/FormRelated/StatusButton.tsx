"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LuSettings } from "react-icons/lu";
import { UpdateFormStatus } from "@/actions/form"; // Make sure path is correct

export const StatusButton = ({
  status,
  formId,
}: {
  status: string;
  formId: number;
}) => {
  const statuses = ["draft", "active", "closed"];

  const handleStatusChange = async (newStatus: string) => {
    try {
      await UpdateFormStatus(formId, newStatus);
      window.location.reload();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LuSettings className="h-4 w-4" />
          Status: {status.charAt(0).toUpperCase() + status.slice(1)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {statuses.map((s) => (
          <DropdownMenuItem
            key={s}
            className="capitalize"
            disabled={s === status}
            onClick={() => handleStatusChange(s)}
          >
            {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
