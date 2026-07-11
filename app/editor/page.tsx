import { EditorProvider } from "@/components/editor-context";
import { EditorLayout } from "@/components/editor-layout";
import { ProjectProvider } from "@/components/project-context";

export default async function EditorPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project } = await searchParams;
  return (
    <EditorProvider>
      <ProjectProvider initialProjectId={project}>
        <EditorLayout loadPendingColor={!project} />
      </ProjectProvider>
    </EditorProvider>
  );
}
