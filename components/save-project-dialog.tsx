"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useProject } from "@/components/project-context";

export function SaveProjectDialog() {
  const project = useProject();
  if (!project.saveDialogOpen) return null;
  return <SaveProjectForm key={`${project.activeProjectId ?? "new"}-${project.saveDialogOpen}`} />;
}

function SaveProjectForm() {
  const project = useProject();
  const [name, setName] = useState(project.activeProjectName ?? "");
  const [description, setDescription] = useState(project.activeProjectDescription);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true">
    <form className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onSubmit={async (event) => {
      event.preventDefault();
      if (!name.trim()) { toast.error("Escribe un nombre para el proyecto."); return; }
      if (await project.saveCurrentProject({ name, description })) project.finishSaveDialog();
    }}>
      <h2 className="text-lg font-semibold text-[#202124]">Guardar proyecto</h2>
      <label className="mt-5 block text-sm font-medium">Nombre<input autoFocus maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[#dfe3e8] px-3 outline-none focus:border-[#2563eb]" /></label>
      <label className="mt-4 block text-sm font-medium">Descripción<textarea maxLength={300} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 w-full rounded-md border border-[#dfe3e8] p-3 outline-none focus:border-[#2563eb]" /></label>
      <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={project.cancelSaveDialog} className="h-10 rounded-md border px-4 text-sm font-semibold">Cancelar</button><button disabled={project.isSaving} className="h-10 rounded-md bg-[#1f2421] px-4 text-sm font-semibold text-white">{project.isSaving ? "Guardando..." : "Guardar"}</button></div>
    </form>
  </div>;
}
