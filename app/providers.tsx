'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { Provider as ReduxProvider, useDispatch } from 'react-redux';
import { store } from '@/store/store';
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { useEffect } from 'react';
import { setSystemTheme } from '@/store/features/themeSlice';
import { StoreProvider } from './StoreProvider';

function ThemeWatcher() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Watch for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      dispatch(setSystemTheme(e.matches ? 'dark' : 'light'));
    };

    handleChange(mediaQuery); // Initial check
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [dispatch]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <NextThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ThemeWatcher />
        <UserProvider>{children}</UserProvider>
      </NextThemeProvider>
    </StoreProvider>
  );
}