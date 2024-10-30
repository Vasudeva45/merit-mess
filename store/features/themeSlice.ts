import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeState = {
  theme: 'light' | 'dark' | 'system';
  systemTheme: 'light' | 'dark';
};

const initialState: ThemeState = {
  theme: 'system',
  systemTheme: 'light',
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setSystemTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.systemTheme = action.payload;
    },
  },
});

export const { setTheme, setSystemTheme } = themeSlice.actions;
export default themeSlice.reducer;