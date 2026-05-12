/**
 * Shared minimal declarations for the global window.google namespace used
 * by Maps JS API (TripMap.tsx) and Picker API (GoogleDrivePanel.tsx).
 * Each consumer keeps its own narrower local types and casts as needed —
 * this file just makes the global key safe to access.
 */

declare global {
  interface Window {
    google?: {
      maps?: unknown;
      picker?: unknown;
    };
    gapi?: { load(name: string, cb: () => void): void };
    __tripos_gmaps_loading?: Promise<void>;
    __tripos_picker_loading?: Promise<void>;
  }
}

export {};
