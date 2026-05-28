import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface GuestContextValue {
  isGuest: boolean;
  initialPath: string | null;
  enterGuestMode: (path?: string) => void;
  exitGuestMode: () => void;
  clearInitialPath: () => void;
}

const GuestContext = createContext<GuestContextValue>({
  isGuest: false,
  initialPath: null,
  enterGuestMode: () => {},
  exitGuestMode: () => {},
  clearInitialPath: () => {},
});

export function GuestProvider({ children }: { children: ReactNode }) {
  const [isGuest, setIsGuest] = useState(false);
  const [initialPath, setInitialPath] = useState<string | null>(null);

  const enterGuestMode = useCallback((path?: string) => {
    setIsGuest(true);
    setInitialPath(path ?? null);
  }, []);

  const exitGuestMode = useCallback(() => {
    setIsGuest(false);
    setInitialPath(null);
  }, []);

  const clearInitialPath = useCallback(() => setInitialPath(null), []);

  return (
    <GuestContext.Provider value={{ isGuest, initialPath, enterGuestMode, exitGuestMode, clearInitialPath }}>
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest() {
  return useContext(GuestContext);
}
