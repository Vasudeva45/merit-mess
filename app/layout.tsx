"use client";

import localFont from "next/font/local";
import "./globals.css";
import { useUser } from "@auth0/nextjs-auth0/client";
import Navbar from "@/components/navbar";
import { Providers } from "./providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Separate component to handle user state checks
const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useUser();

  return (
    <div className={`mx-auto min-h-screen justify-center w-full ${geistSans.variable} ${geistMono.variable} antialiased`}>
      {/* Only show Navbar if user is logged in */}
      {user && !isLoading && <Navbar />}
      <div className={`${user ? 'p-8' : 'p-0'}`}>{children}</div>
    </div>
  );
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}