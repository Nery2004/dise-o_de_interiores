import { ColorLibraryPage } from "@/components/color-library-page";
import { SiteHeader } from "@/components/site-header";

export default async function ColorsPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project } = await searchParams;
  return <><SiteHeader /><ColorLibraryPage projectId={project} /></>;
}
