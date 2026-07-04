import { EditorProvider } from "@/components/editor-context";
import { EditorLayout } from "@/components/editor-layout";

export default function EditorPage() {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
}
