"use client";

import { useEffect } from "react";
import { useEditor } from "@/components/editor-context";
import { consumePendingEditorColor } from "@/lib/colors/colorPreferences";

export function PendingEditorColor() {
  const editor = useEditor();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void consumePendingEditorColor().then((pending) => {
        if (!pending) return;
        editor.setActiveColor(pending.hex);
        if (pending.applyToSelection) editor.applyColorToSelectedMask(pending.hex);
      });
    }, 0);
    return () => clearTimeout(timer);
  // only consume once on a new editor
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
