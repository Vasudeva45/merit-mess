"use client";

import localFont from "next/font/local";
import "./globals.css";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
import ProfileTypeModal from "@/app/profile/components/ProfileTypeModal";
import { getProfile, updateProfile } from "@/actions/profile";

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

// Separate component to handle user state checks and profile type modal
const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());

  // Function to check profile type
  const checkProfile = async () => {
    if (user && !isLoading) {
      try {
        const profile = await getProfile();
        if (!profile?.type) {
          setShowTypeModal(true);
        } else {
          setShowTypeModal(false);
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        setShowTypeModal(true);
      }
    }
  };

  // Initial check on mount and when user/loading state changes
  useEffect(() => {
    checkProfile();
  }, [user, isLoading]);

  // Periodic check every 30 seconds when the user is logged in
  useEffect(() => {
    if (!user || isLoading) return;

    const intervalId = setInterval(() => {
      // Only check if the modal isn't already showing
      if (!showTypeModal) {
        checkProfile();
      }
      setLastCheckTime(Date.now());
    }, 30000);

    return () => clearInterval(intervalId);
  }, [user, isLoading, showTypeModal]);

  // Check profile when the tab becomes visible
  useEffect(() => {
    if (!user || isLoading) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Only check if it's been more than 30 seconds since the last check
        if (Date.now() - lastCheckTime > 30000) {
          checkProfile();
          setLastCheckTime(Date.now());
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user, isLoading, lastCheckTime]);

  const handleTypeSelect = async (formData: any) => {
    try {
      await updateProfile(formData);
      setShowTypeModal(false); // Close the modal after successful profile update

      // Force a router refresh and navigate to profile page
      router.refresh();
      router.push("/profile?welcome=true");

      // Ensure the navigation takes effect
      setTimeout(() => {
        if (window.location.pathname !== "/profile") {
          window.location.href = "/profile?welcome=true";
        }
      }, 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  return (
    <div
      className={`mx-auto min-h-screen justify-center w-full ${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <ProfileTypeModal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)} // Use showTypeModal state instead of isModalOpen
        onTypeSelect={handleTypeSelect}
        user={user}
      />
      {user && !isLoading && <Navbar />}
      <div className={`${user ? "p-8" : "p-0"}`}>{children}</div>
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
          <LayoutContent>
            {children}
            <Toaster />
          </LayoutContent>
        </Providers>
      </body>
    </html>
  );
}
