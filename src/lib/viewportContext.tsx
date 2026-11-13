import React, { createContext, useContext, useEffect, useState } from 'react';

export type ViewportMode = 'desktop' | 'phone';

interface ViewportContextType {
  viewportMode: ViewportMode;
  setViewportMode: (mode: ViewportMode) => void;
  toggleViewportMode: () => void;
}

const ViewportContext = createContext<ViewportContextType | undefined>(undefined);

const VIEWPORT_STORAGE_KEY = 'iitdh_portal_viewport';

function applyViewportToDocument(mode: ViewportMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.viewport = mode;
  if (mode === 'phone') {
    root.classList.add('viewport-phone');
    root.classList.remove('viewport-desktop');
  } else {
    root.classList.add('viewport-desktop');
    root.classList.remove('viewport-phone');
  }
}

export const ViewportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewportMode, setViewportModeState] = useState<ViewportMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(VIEWPORT_STORAGE_KEY);
        if (stored === 'phone' || stored === 'desktop') {
          return stored;
        }
      } catch {}
    }
    return 'desktop';
  });

  useEffect(() => {
    applyViewportToDocument(viewportMode);
    try {
      localStorage.setItem(VIEWPORT_STORAGE_KEY, viewportMode);
    } catch {}
  }, [viewportMode]);

  const setViewportMode = (next: ViewportMode) => setViewportModeState(next);
  const toggleViewportMode = () =>
    setViewportModeState((prev) => (prev === 'desktop' ? 'phone' : 'desktop'));

  return (
    <ViewportContext.Provider value={{ viewportMode, setViewportMode, toggleViewportMode }}>
      {children}
    </ViewportContext.Provider>
  );
};

export const useViewport = () => {
  const context = useContext(ViewportContext);
  if (!context) {
    throw new Error('useViewport must be used within a ViewportProvider');
  }
  return context;
};
