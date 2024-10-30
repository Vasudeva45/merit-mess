"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import React from "react";
import { LoginButton } from "./login-button";
import { SignupButton } from "./signup-button";
import { LogoutButton } from "./logout-button";

const Navbar = () => {
  const { user, error, isLoading } = useUser();
  return (
    <div className="py-4 flex w-full justify-between bg-gray-800 px-8">
      <div className="flex gap-8">
        <a className="button_login" href="/">
          Home
        </a>
        <a className="button_login" href="/profile">
          ServerProtectedProfile
        </a>
        <a className="button_login" href="/middleware">
          MiddleWare Protected
        </a>
        <a className="button_login" href="/auth-protected">
          Auth Protected
        </a>
        <a className="button_login" target="_black" href="/api/data">
          Protected Api
        </a>
      </div>
      <div className="flex gap-4">
        {!user && !isLoading && (
          <>
            <SignupButton />
            <LoginButton />
          </>
        )}
        {user && !isLoading && (
          <>
            <LogoutButton />
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;
