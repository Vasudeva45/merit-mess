"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { useDispatch } from "react-redux";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { useEffect } from "react";
import { setSystemTheme } from "@/store/features/themeSlice";
import { StoreProvider } from "./StoreProvider";
import DesignerContextProvider from "@/components/FormRelated/context/DesignerContext";
import NextTopLoader from "nextjs-toploader";

function ThemeWatcher() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Watch for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      dispatch(setSystemTheme(e.matches ? "dark" : "light"));
    };

    handleChange(mediaQuery); // Initial check
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [dispatch]);

  return null;
}

export function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <StoreProvider>
      <NextThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ThemeWatcher />
        <UserProvider>
          <NextTopLoader />
          <DesignerContextProvider>{children}</DesignerContextProvider>
        </UserProvider>
      </NextThemeProvider>
    </StoreProvider>
  );
}
