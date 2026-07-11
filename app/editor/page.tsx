import { EditorProvider } from "@/components/editor-context";
import { EditorLayout } from "@/components/editor-layout";
import { ProjectProvider } from "@/components/project-context";
import { ComparisonProvider } from "@/components/comparison-context";

export default async function EditorPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project } = await searchParams;
  return (
    <EditorProvider>
      <ProjectProvider initialProjectId={project}>
        <ComparisonProvider>
          <EditorLayout loadPendingColor={!project} />
        </ComparisonProvider>
      </ProjectProvider>
    </EditorProvider>
  );
}
