import { createProjectThumbnail } from "@/lib/projects/createProjectThumbnail";
import type { BlendMode, LoadedImage, WallMask } from "@/types/editor";

export function createProposalThumbnail(image: LoadedImage, masks: WallMask[], blendMode: BlendMode) { return createProjectThumbnail(image, masks, blendMode); }
