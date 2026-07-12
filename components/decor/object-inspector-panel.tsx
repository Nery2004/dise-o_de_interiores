"use client";

import { ObjectPropertiesPanel } from "@/components/decor/object-properties-panel";
import { PlacedObjectsList } from "@/components/decor/placed-objects-list";
import { ObjectLightingPanel } from "@/components/decor/object-lighting-panel";
import { useDecorPlacement } from "@/components/decor-placement-context";

export function ObjectInspectorPanel() {
  const placement = useDecorPlacement();
  const object = placement.placedObjects.find((item) => item.id === placement.selectedObjectId);
  return <section className="mb-5 rounded-md border border-[#edf0f3] bg-[#fafbfc] p-4"><ObjectPropertiesPanel />{object ? <ObjectLightingPanel object={object} /> : null}<PlacedObjectsList /></section>;
}
