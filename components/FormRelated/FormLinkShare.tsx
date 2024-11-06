"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ImShare } from "react-icons/im";
import { toast } from "sonner";
import { CheckIcon } from "lucide-react";

function FormLinkShare({ shareURL }: { shareURL: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const shareLink = `${window.location.origin}/submit/${shareURL}`;

  return (
    <div className="flex flex-grow gap-4 items-center">
      <Input value={shareLink} readOnly />
      <Button
        className="w-[250px]"
        onClick={() => {
          navigator.clipboard.writeText(shareLink);
          toast.success("Link copied to clipboard", {
            description: "Thank you!",
            icon: <CheckIcon />,
          });
        }}
      >
        <ImShare className="mr-2 h-4 w-4" />
        Share Link
      </Button>
    </div>
  );
}

export default FormLinkShare;
