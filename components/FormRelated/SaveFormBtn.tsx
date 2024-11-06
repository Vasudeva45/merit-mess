import React, { useTransition } from "react";
import { HiSaveAs } from "react-icons/hi";
import { Button } from "../ui/button";
import useDesigner from "./hooks/useDesigner";
import { UpdateFormContent } from "@/actions/form";
import { FaSpinner } from "react-icons/fa";
import { toast } from "sonner";
import { CheckIcon } from "lucide-react";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

function SaveFormBtn({ id }: Readonly<{ id: number }>) {
  const { elements } = useDesigner();
  const [loading, startTransition] = useTransition();

  const updateFormContent = async () => {
    try {
      const jsonElements = JSON.stringify(elements);
      await UpdateFormContent(id, jsonElements);
      toast.success("Form saved successfully", {
        description: "Thank you!",
        icon: <CheckIcon />,
      });
    } catch (error) {
      toast.error("Something went wrong", {
        description: "comeback later!",
        icon: <ExclamationTriangleIcon />,
      });
    }
  };
  return (
    <div>
      <Button
        variant={"outline"}
        className="gap-2"
        disabled={loading}
        onClick={() => {
          startTransition(updateFormContent);
        }}
      >
        <HiSaveAs className="h-4 w-4" />
        Save
        {loading && <FaSpinner className="animate-spin" />}
      </Button>
    </div>
  );
}

export default SaveFormBtn;
