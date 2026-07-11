"use client";

import { Maximize, Minimize } from "lucide-react";
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) { document.addEventListener("fullscreenchange", callback); return () => document.removeEventListener("fullscreenchange", callback); }
function snapshot() { return document.fullscreenEnabled ? (document.fullscreenElement ? 2 : 1) : 0; }

export function FullscreenButton({ className = "" }: { className?: string }) {
  const state = useSyncExternalStore(subscribe, snapshot, () => 0);
  if (state === 0) return null;
  return <button type="button" onClick={() => void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())} aria-label="Pantalla completa" title="Pantalla completa" className={className}>{state === 2 ? <Minimize size={17} /> : <Maximize size={17} />}</button>;
}
