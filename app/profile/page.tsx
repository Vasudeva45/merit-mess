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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start justify-center">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">
              Client Component
            </h2>
            <div className="flex justify-center">
              <ProfileClient user={user} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">
              Server Component
            </h2>
            <div className="flex justify-center">
              <ProfileServer user={user} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
