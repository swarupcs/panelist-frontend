import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark', // default to dark
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ai-interview-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme immediately after rehydration
        if (state) {
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(state.theme);
        }
      },
    }
  )
);

// Initialize theme immediately to prevent flash of incorrect theme
if (typeof window !== 'undefined') {
  const isDark = localStorage.getItem('ai-interview-theme')?.includes('"theme":"dark"');
  // Default to dark if not set, else use what's stored
  const theme = localStorage.getItem('ai-interview-theme') ? (isDark ? 'dark' : 'light') : 'dark';
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
}
