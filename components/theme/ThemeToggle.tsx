'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { setTheme } from '@/store/features/themeSlice';

export function ThemeToggle() {
  const { theme, setTheme: setNextTheme } = useTheme();
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector((state) => state.theme.theme);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setNextTheme(newTheme);
    dispatch(setTheme(newTheme));
  };

  return (
    <div className="flex items-center space-x-2   rounded-lg p-2">
      <button
        onClick={() => handleThemeChange('light')}
        className={`p-2 rounded-md ${
          currentTheme === 'light' 
            ? 'bg-gray-200 dark:bg-gray-700' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        aria-label="Light mode"
      >
        <Sun className="h-5 w-5" />
      </button>
      <button
        onClick={() => handleThemeChange('dark')}
        className={`p-2 rounded-md ${
          currentTheme === 'dark' 
            ? 'bg-gray-200 dark:bg-gray-700' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        aria-label="Dark mode"
      >
        <Moon className="h-5 w-5" />
      </button>
      <button
        onClick={() => handleThemeChange('system')}
        className={`p-2 rounded-md ${
          currentTheme === 'system' 
            ? 'bg-gray-200 dark:bg-gray-700' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        aria-label="System theme"
      >
        <Monitor className="h-5 w-5" />
      </button>
    </div>
  );
}