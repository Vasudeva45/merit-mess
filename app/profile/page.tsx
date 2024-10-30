import React from "react";
import { getSession } from "@auth0/nextjs-auth0";
import ProfileClient from "./components/user-client";
import ProfileServer from "./components/user-server";
import { redirect } from "next/navigation";

const Profile = async () => {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    redirect("/");
  }

  return (
    <div className="flex items-center justify-center w-full mt-10">
      <div className="flex items-center w-full justify-center">
        {/* Conditionally render the client-side and server-side components */}
        {user && (
          <>
            <div>
              <h1 className="text-2xl mb-4">Client Component</h1>
              <ProfileClient user={user} />
            </div>
            <div>
              <h1 className="text-2xl mb-4">Server Component</h1>
              <ProfileServer user={user} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;