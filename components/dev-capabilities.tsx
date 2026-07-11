"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function DevCapabilities() {
  const indexedDb = useSyncExternalStore(subscribe, () => typeof indexedDB !== "undefined", () => false);
  const canvas = useSyncExternalStore(subscribe, () => { const element = document.createElement("canvas"); return Boolean(element.getContext("2d")); }, () => false);
  return <dl className="grid gap-3 sm:grid-cols-2"><Status label="IndexedDB disponible" value={indexedDb} /><Status label="Canvas disponible" value={canvas} /></dl>;
}

function Status({ label, value }: { label: string; value: boolean }) { return <div className="rounded-lg border border-[#dfe3e8] bg-white p-4"><dt className="text-sm text-[#69717d]">{label}</dt><dd className="mt-1 font-semibold">{value ? "Sí" : "No"}</dd></div>; }
