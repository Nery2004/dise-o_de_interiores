import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { InteriorProject, ProjectChanges, ProjectRepository } from "@/types/project";

interface ProjectDatabase extends DBSchema {
  projects: {
    key: string;
    value: InteriorProject;
    indexes: { updatedAt: string; createdAt: string; name: string };
  };
}

let databasePromise: Promise<IDBPDatabase<ProjectDatabase>> | null = null;

function getDatabase() {
  if (typeof indexedDB === "undefined") throw new Error("IndexedDB unavailable");
  databasePromise ??= openDB<ProjectDatabase>("interior-color-studio", 1, {
    upgrade(database, oldVersion) {
      if (oldVersion < 1) {
        const store = database.createObjectStore("projects", { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
        store.createIndex("createdAt", "createdAt");
        store.createIndex("name", "name");
      }
    },
  });
  return databasePromise;
}

export class IndexedDbProjectRepository implements ProjectRepository {
  async list() { return (await getDatabase()).getAll("projects"); }
  async getById(id: string) { return (await getDatabase()).get("projects", id); }
  async create(project: InteriorProject) {
    await (await getDatabase()).add("projects", project);
    return project;
  }
  async update(id: string, changes: ProjectChanges) {
    const database = await getDatabase();
    const current = await database.get("projects", id);
    if (!current) throw new Error("Project not found");
    const project = { ...current, ...changes, id, createdAt: current.createdAt };
    await database.put("projects", project);
    return project;
  }
  async delete(id: string) { await (await getDatabase()).delete("projects", id); }
}

export const projectRepository = new IndexedDbProjectRepository();

export async function getProjects() { return projectRepository.list(); }
export async function getProjectById(id: string) { return projectRepository.getById(id); }
export async function createProject(project: InteriorProject) { return projectRepository.create(project); }
export async function updateProject(id: string, changes: ProjectChanges) { return projectRepository.update(id, changes); }
export async function deleteProject(id: string) { return projectRepository.delete(id); }
export async function duplicateProject(id: string) {
  const project = await getProjectById(id);
  if (!project) throw new Error("Project not found");
  const now = new Date().toISOString();
  const duplicate: InteriorProject = { ...project, id: crypto.randomUUID(), name: `${project.name} (copia)`, createdAt: now, updatedAt: now };
  return createProject(duplicate);
}
export async function clearAllProjects() { await (await getDatabase()).clear("projects"); }
