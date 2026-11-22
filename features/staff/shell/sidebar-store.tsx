"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createStore, useStore } from "zustand";

import { SIDEBAR_COOKIE } from "./sidebar-cookie";

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
}

interface SidebarActions {
  toggleCollapsed: () => void;
  openMobile: () => void;
  closeMobile: () => void;
}

type SidebarStore = SidebarState & SidebarActions;

// Per-request store: the server reads the cookie, so the first paint already
// has the right width and there is no hydration mismatch.
function createSidebarStore(isCollapsed: boolean) {
  return createStore<SidebarStore>()((set) => ({
    isCollapsed,
    isMobileOpen: false,
    toggleCollapsed: () =>
      set((state) => {
        const next = !state.isCollapsed;
        document.cookie = `${SIDEBAR_COOKIE}=${next ? 1 : 0}; path=/; max-age=31536000; samesite=lax`;
        return { isCollapsed: next };
      }),
    openMobile: () => set({ isMobileOpen: true }),
    closeMobile: () => set({ isMobileOpen: false }),
  }));
}

const SidebarStoreContext = createContext<ReturnType<typeof createSidebarStore> | null>(null);

export function SidebarStoreProvider({ initialCollapsed, children }: { initialCollapsed: boolean; children: ReactNode }) {
  const [store] = useState(() => createSidebarStore(initialCollapsed));
  return <SidebarStoreContext.Provider value={store}>{children}</SidebarStoreContext.Provider>;
}

export function useSidebarStore<T>(selector: (state: SidebarStore) => T): T {
  const store = useContext(SidebarStoreContext);
  if (!store) throw new Error("useSidebarStore must be used inside SidebarStoreProvider");
  return useStore(store, selector);
}
