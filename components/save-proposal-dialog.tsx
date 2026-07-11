"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useProject } from "@/components/project-context";

export function SaveProposalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const project = useProject();
  const [name, setName] = useState(`Propuesta ${project.proposals.length + 1}`);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true"><form className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onSubmit={async (event) => { event.preventDefault(); if (!name.trim()) { toast.error("Escribe un nombre para la propuesta."); return; } if (await project.createProposal({ name, description, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) })) onClose(); }}><h2 className="text-lg font-semibold">Guardar como propuesta</h2><label className="mt-5 block text-sm font-medium">Nombre<input autoFocus maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-md border px-3" /></label><label className="mt-4 block text-sm font-medium">Descripción<textarea maxLength={300} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 w-full rounded-md border p-3" /></label><label className="mt-4 block text-sm font-medium">Etiquetas<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Moderna, Cálida, Opción cliente" className="mt-2 h-11 w-full rounded-md border px-3" /></label><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="h-10 rounded-md border px-4 text-sm font-semibold">Cancelar</button><button className="h-10 rounded-md bg-[#1f2421] px-4 text-sm font-semibold text-white">Guardar</button></div></form></div>;
}
