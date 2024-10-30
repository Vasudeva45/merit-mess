import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import Navbar from "@/components/navbar";
import { StoreProvider } from "./StoreProvider";

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

export const metadata: Metadata = {
  title: "Project Launch",
  description: "A collaborative platform for youth initiatives",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`mx-auto min-h-screen justify-center w-full ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StoreProvider>
          <UserProvider>
            <Navbar />
            <div className="p-8">{children}</div>
          </UserProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
