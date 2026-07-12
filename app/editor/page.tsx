import { EditorProvider } from "@/components/editor-context";
import { EditorLayout } from "@/components/editor-layout";
import { ProjectProvider } from "@/components/project-context";
import { ComparisonProvider } from "@/components/comparison-context";
import { DecorPlacementProvider } from "@/components/decor-placement-context";
import { RoomLightingProvider } from "@/components/room-lighting-context";

export default async function EditorPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project } = await searchParams;
  return (
    <EditorProvider>
      <DecorPlacementProvider>
        <RoomLightingProvider>
          <ProjectProvider initialProjectId={project}>
            <ComparisonProvider>
              <EditorLayout loadPendingColor={!project} />
            </ComparisonProvider>
          </ProjectProvider>
        </RoomLightingProvider>
      </DecorPlacementProvider>
    </EditorProvider>
  );
}
