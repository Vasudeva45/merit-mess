"use client";

import { getProfile } from "@/actions/profile";
import Navbar from "@/components/navbar";
import CustomToast, { ToastMessage } from "@/components/Toast/custom-toast";
import { useUser } from "@auth0/nextjs-auth0/client";
import localFont from "next/font/local";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import "./globals.css";
import { Providers } from "./providers";
import { X } from "lucide-react"; // Import X icon from lucide-react

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

// Define an interface for the form data
// interface ProfileFormData {
//   type: string;
//   userId?: string;
//   name?: string;
//   email?: string;
//   [key: string]: unknown;
// }

// Separate component to handle user state checks and profile type modal
// Separate component to handle user state checks and profile type modal
const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useUser();
  const router = useRouter();
  // const [showTypeModal, setShowTypeModal] = useState(false); // Commented out the modal state
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());
  const [isOnline, setIsOnline] = useState(true);
  const [toast, setToast] = useState<{
    message: ToastMessage;
    type: "success" | "error";
  } | null>(null);
  const [showProfileMessage, setShowProfileMessage] = useState(false); // New state for profile setup message

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

  const checkProfile = useCallback(async () => {
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
          // Set the profile message state instead of showing modal
          setShowProfileMessage(true);
        } else {
          setShowProfileMessage(false);
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        // Only show message if we have internet connection
        if (checkInternetConnection()) {
          setShowProfileMessage(true);
        }
      }
    }
  }, [user, isLoading]);

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
      // setShowTypeModal(false); // Commented out
      setShowProfileMessage(false);
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
  }, [user, isLoading, checkProfile]);

  useEffect(() => {
    if (!user || isLoading || !isOnline) return;

    const intervalId = setInterval(() => {
      // if (!showTypeModal) { // Commented out
      if (!showProfileMessage) {
        checkProfile();
      }
      setLastCheckTime(Date.now());
    }, 30000);

    return () => clearInterval(intervalId);
  }, [user, isLoading, showProfileMessage, isOnline, checkProfile]);

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
  }, [user, isLoading, lastCheckTime, isOnline, checkProfile]);

  // This function is kept but won't be used with the automatic modal
  // const handleTypeSelect = async (formData: ProfileFormData) => {
  //   if (!isOnline) {
  //     showToast(
  //       "No Internet Connection",
  //       "Please check your internet connection and try again.",
  //       "error"
  //     );
  //     return;
  //   }

  //   try {
  //     await updateProfile(formData);
  //     // setShowTypeModal(false); // Commented out
  //     setShowProfileMessage(false);
  //     showToast(
  //       "Profile Updated",
  //       "Your profile type has been successfully updated.",
  //       "success"
  //     );

  //     router.refresh();
  //     router.push("/profile?welcome=true");

  //     setTimeout(() => {
  //       if (window.location.pathname !== "/profile") {
  //         window.location.href = "/profile?welcome=true";
  //       }
  //     }, 1000);
  //   } catch (error) {
  //     console.error("Error updating profile:", error);
  //     showToast(
  //       "Update Failed",
  //       "Failed to update profile type. Please try again.",
  //       "error"
  //     );
  //     throw error;
  //   }
  // };

  return (
    <div
      className={`mx-auto min-h-screen justify-center w-full ${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      {/* Replaced modal with a notification banner with close button */}
      {isOnline && showProfileMessage && user && !isLoading && (
        <div className="bg-blue-500 text-white p-4 text-center relative">
          Please go to your profile page to set up your profile type first.
          <button
            onClick={() => router.push("/profile")}
            className="ml-2 underline hover:text-blue-100"
          >
            Go to profile
          </button>
          <button
            onClick={() => setShowProfileMessage(false)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-blue-600 rounded-full"
            aria-label="Close notification"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Commented out the ProfileTypeModal
      {isOnline && (
        <ProfileTypeModal
          isOpen={showTypeModal}
          onClose={() => setShowTypeModal(false)}
          onTypeSelect={handleTypeSelect}
          user={user}
        />
      )} */}

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
