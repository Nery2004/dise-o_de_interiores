"use client";

import { Toaster } from "sonner";
import { CanvasViewer } from "@/components/canvas-viewer";
import { EditorHeader } from "@/components/editor-header";
import { FooterStatus } from "@/components/footer-status";
import { LeftToolbar } from "@/components/left-toolbar";
import { RightPanel } from "@/components/right-panel";
import { SaveProjectDialog } from "@/components/save-project-dialog";
import { UnsavedChangesDialog } from "@/components/unsaved-changes-dialog";
import { PendingEditorColor } from "@/components/pending-editor-color";
import { useComparison } from "@/components/comparison-context";
import { PresentationMode } from "@/components/presentation-mode";
import { ObjectKeyboardShortcuts } from "@/components/decor/object-keyboard-shortcuts";
import { DevEditorDiagnostics } from "@/components/dev-editor-diagnostics";
import { renderProfiler } from "@/lib/performance/RenderProfiler";

export function EditorLayout({ loadPendingColor = false }: { loadPendingColor?: boolean }) {
  renderProfiler.mark("EditorLayout");
  const comparison = useComparison();
  if (comparison.presentationMode) return <><PresentationMode /><Toaster richColors position="top-right" /></>;
  return (
    <main className="flex min-h-screen flex-col bg-[#f3f4f6] text-[#202124]">
      <EditorHeader />
      <div className="grid flex-1 min-h-0 grid-cols-1 gap-3 p-3 lg:grid-cols-[232px_minmax(0,1fr)_288px]">
        <LeftToolbar />
        <CanvasViewer />
        <RightPanel />
      </div>
      <FooterStatus />
      <SaveProjectDialog />
      <UnsavedChangesDialog />
      <ObjectKeyboardShortcuts />
      <DevEditorDiagnostics />
      {loadPendingColor ? <PendingEditorColor /> : null}
      <Toaster richColors position="top-right" />
    </main>
  );
}
