import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';

interface DarkModeContextValue {
  isDark: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

const DarkModeContext = createContext<DarkModeContextValue | null>(null);

const STORAGE_KEY = 'theme';

export function DarkModeProvider({ children }: { children: ReactNode }) {
  // The inline script in index.html already set the class before paint; read it
  // back so React's first render agrees and the page never flashes.
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');

    // Keeps the iOS status bar tint in step with the theme.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDark ? '#0f1113' : '#faf8f5');
  }, [isDark]);

  // Follow the system setting until the user makes an explicit choice.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) setIsDark(event.matches);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const value = useMemo(
    () => ({
      isDark,
      toggleDarkMode: () => setIsDark((current) => !current),
      setDarkMode: setIsDark,
    }),
    [isDark]
  );

  return <DarkModeContext.Provider value={value}>{children}</DarkModeContext.Provider>;
}

export function useDarkMode(): DarkModeContextValue {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used inside a DarkModeProvider');
  }
  return context;
}
