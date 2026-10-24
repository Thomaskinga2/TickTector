"use client";

import { useSyncExternalStore } from "react";
import { getServerCatches, readCatches, subscribe, type TickdexCatch } from "@/lib/tickdex";

// The player's catches, newest first. Empty during server render; updates when any tab records a catch.
export function useTickdex(): TickdexCatch[] {
  return useSyncExternalStore(subscribe, readCatches, getServerCatches);
}
