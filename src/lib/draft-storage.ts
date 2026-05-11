"use client";

import type { PlannerDraft } from "@/types/planner";

const STORAGE_KEY = "shipready:v0-draft";

export function loadPlannerDraft(): PlannerDraft | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as PlannerDraft) : null;
  } catch {
    return null;
  }
}

export function savePlannerDraft(draft: PlannerDraft) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function clearPlannerDraft() {
  window.localStorage.removeItem(STORAGE_KEY);
}
