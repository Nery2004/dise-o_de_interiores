"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Download, FileUp, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { exportProjectFile, importProjectFile } from "@/lib/projects/projectImportExport";
import { createProject, deleteProject, duplicateProject, getProjects, updateProject } from "@/lib/projects/projectStorage";
import type { InteriorProject } from "@/types/project";

type SortMode = "updated" | "created" | "name-asc" | "name-desc";

export function ProjectsClient() {
  const [projects, setProjects] = useState<InteriorProject[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("updated");
  const [deleteTarget, setDeleteTarget] = useState<InteriorProject | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try { setProjects(await getProjects()); }
    catch { toast.error("No se pudieron leer los proyectos de este dispositivo."); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function runMutation(action: () => Promise<unknown>, successMessage?: string) {
    try {
      await action();
      await refresh();
      if (successMessage) toast.success(successMessage);
    } catch {
      toast.error("No se pudo actualizar el almacenamiento local.");
    }
  }

  const visibleProjects = projects.filter((project) => project.name.toLowerCase().includes(query.toLowerCase())).sort((first, second) => {
    if (sort === "updated") return second.updatedAt.localeCompare(first.updatedAt);
    if (sort === "created") return second.createdAt.localeCompare(first.createdAt);
    return sort === "name-asc" ? first.name.localeCompare(second.name) : second.name.localeCompare(first.name);
  });

  return <main className="min-h-[calc(100vh-4rem)] bg-[#f4f0e7] px-5 py-10 sm:px-8 lg:px-10">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#697469]">Biblioteca local</p><h1 className="mt-2 text-3xl font-semibold text-[#1f2421]">Mis proyectos</h1><p className="mt-2 text-sm text-[#687169]">Guardados únicamente en este dispositivo.</p></div>
        <div className="flex gap-2"><button onClick={() => inputRef.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-md border border-[#d7d0c3] bg-white px-4 text-sm font-semibold"><FileUp size={16} />Importar proyecto</button><Link href="/editor" className="inline-flex h-11 items-center gap-2 rounded-md bg-[#1f2421] px-4 text-sm font-semibold text-white"><Plus size={16} />Nuevo proyecto</Link></div>
      </div>
      <input ref={inputRef} hidden type="file" accept=".json,application/json" onChange={async (event) => {
        const file = event.target.files?.[0];
        event.currentTarget.value = "";
        if (!file) return;
        try { await createProject(await importProjectFile(file)); await refresh(); toast.success("Proyecto importado correctamente."); }
        catch (error) { toast.error(error instanceof Error && error.message === "INCOMPATIBLE_VERSION" ? "Este proyecto fue creado con una versión incompatible." : "El archivo del proyecto no es válido."); }
      }} />

      <div className="mt-8 flex flex-wrap gap-3 rounded-lg border border-[#ded6c9] bg-white/70 p-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre..." className="h-10 min-w-64 flex-1 rounded-md border border-[#dfe3e8] px-3 text-sm outline-none focus:border-[#2563eb]" />
        <select aria-label="Ordenar proyectos" value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="h-10 rounded-md border border-[#dfe3e8] bg-white px-3 text-sm"><option value="updated">Modificados recientemente</option><option value="created">Creados recientemente</option><option value="name-asc">Nombre A-Z</option><option value="name-desc">Nombre Z-A</option></select>
      </div>

      {visibleProjects.length === 0 ? <div className="mt-8 rounded-xl border border-dashed border-[#cfc7ba] bg-white/55 px-6 py-16 text-center text-[#687169]">No hay proyectos que coincidan con la búsqueda.</div> : <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visibleProjects.map((project) => <article key={project.id} className="overflow-hidden rounded-xl border border-[#ded6c9] bg-white shadow-sm">
        <div className="relative aspect-[16/10] bg-[#e8e4dc]">{project.thumbnail ? <Image src={project.thumbnail} alt={`Miniatura de ${project.name}`} fill unoptimized className="object-cover" /> : <div className="grid h-full place-items-center text-sm text-[#8a929e]">Sin miniatura</div>}</div>
        <div className="p-5"><h2 className="truncate text-lg font-semibold text-[#202124]">{project.name}</h2><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#69717d]">{project.description || "Sin descripción"}</p><dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#69717d]"><div><dt>Resolución</dt><dd className="font-semibold text-[#30343b]">{project.originalImage.width}×{project.originalImage.height}</dd></div><div><dt>Máscaras</dt><dd className="font-semibold text-[#30343b]">{project.masks.length}</dd></div></dl><p className="mt-3 text-xs text-[#8a929e]">Modificado {new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(project.updatedAt))}</p>
        <div className="mt-5 grid grid-cols-2 gap-2"><Link href={`/editor?project=${encodeURIComponent(project.id)}`} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#1f2421] text-xs font-semibold text-white"><FolderOpen size={14} />Abrir</Link><button onClick={() => void runMutation(() => duplicateProject(project.id), "Proyecto duplicado.")} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border text-xs font-semibold"><Copy size={14} />Duplicar</button><button onClick={() => { const name = window.prompt("Nuevo nombre", project.name)?.trim(); if (!name) return; void runMutation(() => updateProject(project.id, { name: name.slice(0, 80), updatedAt: new Date().toISOString() })); }} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border text-xs font-semibold"><Pencil size={14} />Renombrar</button><button onClick={() => setDeleteTarget(project)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#f0c7c2] text-xs font-semibold text-[#b42318]"><Trash2 size={14} />Eliminar</button><button onClick={() => void exportProjectFile(project).catch(() => toast.error("No se pudo exportar el proyecto."))} className="col-span-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-md border text-xs font-semibold"><Download size={14} />Exportar archivo</button></div></div>
      </article>)}</div>}
    </div>
    {deleteTarget ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-xl bg-white p-6"><h2 className="text-lg font-semibold">¿Eliminar este proyecto?</h2><p className="mt-3 text-sm leading-6 text-[#69717d]">Esta acción eliminará la copia guardada en este dispositivo.</p><div className="mt-6 flex justify-end gap-2"><button onClick={() => setDeleteTarget(null)} className="h-10 rounded-md border px-4 text-sm font-semibold">Cancelar</button><button onClick={() => { const id = deleteTarget.id; setDeleteTarget(null); void runMutation(() => deleteProject(id), "Proyecto eliminado."); }} className="h-10 rounded-md bg-[#b42318] px-4 text-sm font-semibold text-white">Eliminar</button></div></div></div> : null}
    <Toaster richColors position="top-right" />
  </main>;
}
