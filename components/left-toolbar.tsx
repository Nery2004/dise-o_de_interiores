"use client";

import {
  Brush,
  Eraser,
  Hand,
  MousePointer2,
  ScanSearch,
  SplitSquareHorizontal,
} from "lucide-react";
import { useEditor } from "@/components/editor-context";
import { editorTools } from "@/lib/editor-data";
import { cn } from "@/lib/utils";
import type { EditorTool } from "@/types/editor";

const toolIcons: Record<EditorTool, React.ComponentType<{ size?: number }>> = {
  select: MousePointer2,
  "paint-wall": Brush,
  eraser: Eraser,
  zoom: ScanSearch,
  pan: Hand,
  compare: SplitSquareHorizontal,
};

export function LeftToolbar() {
  const { activeTool, setActiveTool } = useEditor();

  return (
    <aside className="rounded-lg border border-[#dde1e7] bg-white p-3 shadow-sm">
      <div className="mb-3 border-b border-[#edf0f3] pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8290]">
          Herramientas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {editorTools.map((tool) => {
          const Icon = toolIcons[tool.id];
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActiveTool(tool.id)}
              className={cn(
                "flex h-12 items-center justify-between rounded-md border px-3 text-left text-sm font-medium transition",
                isActive
                  ? "border-[#1f2421] bg-[#1f2421] text-white shadow-sm"
                  : "border-transparent bg-[#f7f8fa] text-[#3b414a] hover:border-[#d7dce3] hover:bg-white",
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icon size={17} />
                <span className="truncate">{tool.label}</span>
              </span>
              <span
                className={cn(
                  "hidden rounded border px-1.5 py-0.5 text-[10px] font-semibold sm:inline",
                  isActive
                    ? "border-white/30 text-white/80"
                    : "border-[#d8dde4] text-[#8a929e]",
                )}
              >
                {tool.shortcut}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
