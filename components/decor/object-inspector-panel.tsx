"use client";

import { ObjectPropertiesPanel } from "@/components/decor/object-properties-panel";
import { PlacedObjectsList } from "@/components/decor/placed-objects-list";

export function ObjectInspectorPanel() {
  return <section className="mb-5 rounded-md border border-[#edf0f3] bg-[#fafbfc] p-4"><ObjectPropertiesPanel /><PlacedObjectsList /></section>;
}
