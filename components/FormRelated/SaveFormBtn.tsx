import React, { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import useDesigner from "./hooks/useDesigner";
import { UpdateFormContent } from "@/actions/form";
import CustomToast from "@/components/Toast/custom-toast";

const SaveFormBtn = ({ id }: { id: number }) => {
  const { elements } = useDesigner();
  const [loading, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: { title: string; details: string };
  } | null>(null);

  const updateFormContent = async () => {
    try {
      const jsonElements = JSON.stringify(elements);
      await UpdateFormContent(id, jsonElements);
      setToast({
        type: "success",
        message: {
          title: "Form Saved Successfully",
          details: `Operation ID: ${id} • ${elements.length} elements processed`,
        },
      });
    } catch (error) {
      setToast({
        type: "error",
        message: {
          title: "Operation Failed",
          details: `Error Code: ${error?.code || "UNKNOWN"} • ${
            error?.message || "An unexpected error occurred"
          }`,
        },
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="gap-2 h-9 px-4 font-mono"
        disabled={loading}
        onClick={() => startTransition(updateFormContent)}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {loading ? "Saving..." : "Save Form"}
      </Button>

      {toast && (
        <CustomToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <style jsx global>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </>
  );
};

export default SaveFormBtn;
