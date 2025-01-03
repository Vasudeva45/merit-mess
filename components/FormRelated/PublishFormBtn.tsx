import { PublishForm } from "@/actions/form";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { MdOutlinePublish } from "react-icons/md";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import CustomToast from "@/components/Toast/custom-toast";

function PublishFormBtn({ id }: { id: number }) {
  const [loading, startTransition] = useTransition();
  const router = useRouter();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: { title: string; details: string };
  } | null>(null);

  async function publishForm() {
    try {
      await PublishForm(id);
      setToast({
        type: "success",
        message: {
          title: "Form Published Successfully",
          details: `Form ID: ${id} • Status: Public • Link copied to clipboard`,
        },
      });
      router.refresh();
    } catch (error) {
      setToast({
        type: "error",
        message: {
          title: "Publication Failed",
          details: `Error Code: ${error?.code || "UNKNOWN"} • ${
            error?.message || "Failed to publish form"
          }`,
        },
      });
    }
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="gap-2 text-white bg-gradient-to-r from-indigo-400 to-cyan-400">
            <MdOutlinePublish className="h-4 w-4" />
            Publish
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. After publishing you will not be
              able to edit this form. <br />
              <br />
              <span className="font-medium">
                By publishing this form you will make it available to the public
                and you will be able to collect submissions.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                startTransition(() => publishForm());
              }}
            >
              {loading ? (
                <>
                  Publishing
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                </>
              ) : (
                "Proceed"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {toast && (
        <CustomToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

export default PublishFormBtn;
