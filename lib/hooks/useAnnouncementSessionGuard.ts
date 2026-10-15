"use client";

import { useSyncExternalStore } from "react";

/**
 * Session-scoped presentation state for in-app announcements.
 *
 * The dashboard popup must present each announcement at most once per browser
 * session, while the header inbox always keeps the full history available. A
 * plain `useState` cannot model this because the value has to survive React
 * remounts whenever the user leaves and returns to the dashboard, so the state
 * lives in `sessionStorage` and is exposed through `useSyncExternalStore`.
 *
 * A fresh page load is intentionally a new session: an announcement the user
 * never dismissed may be presented again, which matches the "until dismissed"
 * delivery rule on the server.
 */
const STORAGE_KEY = "lihatin:in-app-announcements:session";

export interface AnnouncementSessionState {
  /** Announcements already presented in this session. */
  shown: string[];
  /** Announcement currently on screen, or null when nothing is presented. */
  active: string | null;
}

const EMPTY_STATE: AnnouncementSessionState = { shown: [], active: null };

// `useSyncExternalStore` requires `getSnapshot` to return a referentially stable
// value, so the parsed state is cached against the raw stored string.
let cachedRaw: string | null = null;
let cachedState: AnnouncementSessionState = EMPTY_STATE;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Never re-renders; used only to detect that hydration finished. */
const subscribeNoop = () => () => {};
const getTrue = () => true;
const getFalse = () => false;

function parse(raw: string | null): AnnouncementSessionState {
  if (!raw) return EMPTY_STATE;
  try {
    const value = JSON.parse(raw) as Partial<AnnouncementSessionState>;
    return {
      shown: Array.isArray(value.shown)
        ? value.shown.filter((id): id is string => typeof id === "string")
        : [],
      active: typeof value.active === "string" ? value.active : null,
    };
  } catch {
    return EMPTY_STATE;
  }
}

function read(): AnnouncementSessionState {
  if (typeof window === "undefined") return EMPTY_STATE;

  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode, quota). Keep the last value.
    return cachedState;
  }

  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  cachedState = parse(raw);
  return cachedState;
}

function write(state: AnnouncementSessionState) {
  const raw = JSON.stringify(state);
  try {
    window.sessionStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Ignore persistence failures: the popup still behaves correctly for this
    // mount, it may just be presented again after a remount.
  }
  cachedRaw = raw;
  cachedState = state;
  emit();
}

/** Marks an announcement as presented and displayed. */
export function presentAnnouncement(id: string) {
  const state = read();
  if (state.active === id) return;
  write({
    active: id,
    shown: state.shown.includes(id) ? state.shown : [...state.shown, id],
  });
}

/** Closes the current announcement. It stays in `shown` for the whole session. */
export function dismissAnnouncement() {
  if (read().active === null) return;
  write({ ...read(), active: null });
}

/**
 * Reads the session presentation state. `hydrated` is false during SSR and the
 * first hydration render so the popup cannot open before storage is available.
 */
export function useAnnouncementSession() {
  const state = useSyncExternalStore(subscribe, read, () => EMPTY_STATE);
  const hydrated = useSyncExternalStore(subscribeNoop, getTrue, getFalse);

  return { ...state, hydrated };
}
