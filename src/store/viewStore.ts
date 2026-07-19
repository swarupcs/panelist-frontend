// src/store/viewStore.ts
//
// Which view the app is showing: practice or hiring.
//
// Shared rather than held per component. This started as local state inside
// `useAvailableViews`, which looked fine and was not: every caller of that
// hook got its own copy, so switching in the sidebar's switcher changed that
// component's idea of the view and nothing else — the navigation next to it
// carried on showing the other one.
//
// Anything two components must agree on cannot live in either of them.

import { create } from 'zustand'

export type AppView = 'candidate' | 'recruiter'

/** Remembered per device so somebody with both views lands where they left off. */
const STORAGE_KEY = 'panelist_last_view'

interface ViewState {
  /** What they last chose. Whether it is honoured depends on what they have. */
  preferred: AppView
  setPreferred: (view: AppView) => void
}

export const useViewStore = create<ViewState>((set) => ({
  preferred:
    (localStorage.getItem(STORAGE_KEY) as AppView | null) === 'recruiter'
      ? 'recruiter'
      : 'candidate',

  setPreferred: (view) => {
    localStorage.setItem(STORAGE_KEY, view)
    set({ preferred: view })
  },
}))
