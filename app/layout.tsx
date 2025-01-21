"use client";

import localFont from "next/font/local";
import "./globals.css";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { Providers } from "./providers";
import ProfileTypeModal from "@/app/profile/components/ProfileTypeModal";
import { getProfile, updateProfile } from "@/actions/profile";
import CustomToast, { ToastMessage } from "@/components/Toast/custom-toast";

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
  const [isOnline, setIsOnline] = useState(true);
  const [toast, setToast] = useState<{
    message: ToastMessage;
    type: "success" | "error";
  } | null>(null);

  const showToast = (
    title: string,
    details: string,
    type: "success" | "error"
  ) => {
    setToast({
      message: { title, details },
      type,
    });
  };

  const checkInternetConnection = () => {
    return window.navigator.onLine;
  };

  const checkProfile = async () => {
    if (!checkInternetConnection()) {
      setIsOnline(false);
      showToast(
        "No Internet Connection",
        "Please check your internet connection and try again.",
        "error"
      );
      return;
    }

    setIsOnline(true);

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
        // Only show modal if we have internet connection
        if (checkInternetConnection()) {
          setShowTypeModal(true);
        }
      }
    }
  };

  useEffect(() => {
    checkProfile();

    // Add event listeners for online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Connected", "Internet connection restored", "success");
      checkProfile();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowTypeModal(false);
      showToast(
        "No Internet Connection",
        "Please check your internet connection and try again.",
        "error"
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user, isLoading]);

  useEffect(() => {
    if (!user || isLoading || !isOnline) return;

    const intervalId = setInterval(() => {
      if (!showTypeModal) {
        checkProfile();
      }
      setLastCheckTime(Date.now());
    }, 30000);

    return () => clearInterval(intervalId);
  }, [user, isLoading, showTypeModal, isOnline]);

  useEffect(() => {
    if (!user || isLoading || !isOnline) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (Date.now() - lastCheckTime > 30000) {
          checkProfile();
          setLastCheckTime(Date.now());
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user, isLoading, lastCheckTime, isOnline]);

  const handleTypeSelect = async (formData: any) => {
    if (!isOnline) {
      showToast(
        "No Internet Connection",
        "Please check your internet connection and try again.",
        "error"
      );
      return;
    }

    try {
      await updateProfile(formData);
      setShowTypeModal(false);
      showToast(
        "Profile Updated",
        "Your profile type has been successfully updated.",
        "success"
      );

      router.refresh();
      router.push("/profile?welcome=true");

      setTimeout(() => {
        if (window.location.pathname !== "/profile") {
          window.location.href = "/profile?welcome=true";
        }
      }, 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast(
        "Update Failed",
        "Failed to update profile type. Please try again.",
        "error"
      );
      throw error;
    }
  };

  return (
    <div
      className={`mx-auto min-h-screen justify-center w-full ${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      {isOnline && (
        <ProfileTypeModal
          isOpen={showTypeModal}
          onClose={() => setShowTypeModal(false)}
          onTypeSelect={handleTypeSelect}
          user={user}
        />
      )}
      {user && !isLoading && <Navbar />}
      <div className={`${user ? "p-8" : "p-0"}`}>{children}</div>
      {toast && (
        <CustomToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
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
