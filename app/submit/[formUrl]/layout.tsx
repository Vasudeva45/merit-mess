"use client";

import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen min-w-full bg-background max-h-screen h-screen">
      <div className="flex w-full flex-grow">{children}</div>
    </div>
  );
};

export default Layout;
