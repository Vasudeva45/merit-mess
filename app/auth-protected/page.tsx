import { NextPage } from "next";
import { getSession, withPageAuthRequired } from "@auth0/nextjs-auth0";

import React from "react";
import Image from "next/image";

const AuthProtected: NextPage = withPageAuthRequired(
  async () => {
    const session = await getSession();
    interface User {
      picture: string;
      name: string;
      email: string;
    }

    const user: User = session?.user as User;
    return (
      <div className="content-layout px-44">
        <Image src={user.picture} alt={user.name} />
        <h2>{user.name}</h2>
        <p>{user.email}</p>
      </div>
    );
  },
  { returnTo: "/auth-protected" }
);

export default AuthProtected;
