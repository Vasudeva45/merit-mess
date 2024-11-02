import React from "react";
import { getSession } from "@auth0/nextjs-auth0";
import ProfileClient from "./components/user-client";
import ProfileServer from "./components/user-server";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";

const Profile = async () => {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-center">User Profile</h1>
          <p className="text-muted-foreground text-center">
            View your profile information rendered both client and server side
          </p>
        </div>

        <Separator />

      </div>
    </div>
  );
};

export default Profile;
