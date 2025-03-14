"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { useEffect } from "react";

function ErrorPage({ error }: { error: Error }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4">
      <h2 className="text-destructive text-4xl">Something went wrong!</h2>
      <Button asChild>
        <Link href={"/project/new"}>Go back to home</Link>
      </Button>
    </div>
  );
}

export default ErrorPage;
