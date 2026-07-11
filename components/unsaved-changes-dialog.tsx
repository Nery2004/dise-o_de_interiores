"use client";

import { useProject } from "@/components/project-context";

export function UnsavedChangesDialog() {
  const project = useProject();
  if (!project.unsavedDialogOpen) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-semibold">Cambios sin guardar</h2><p className="mt-3 text-sm leading-6 text-[#69717d]">Hay cambios que todavía no se han guardado en este dispositivo.</p><div className="mt-6 grid gap-2"><button onClick={() => void project.saveAndContinue()} className="h-10 rounded-md bg-[#1f2421] text-sm font-semibold text-white">Guardar y continuar</button><button onClick={project.continueWithoutSaving} className="h-10 rounded-md border border-[#f0c7c2] text-sm font-semibold text-[#b42318]">Continuar sin guardar</button><button onClick={project.cancelPendingAction} className="h-10 rounded-md border text-sm font-semibold">Cancelar</button></div></div></div>;
}
