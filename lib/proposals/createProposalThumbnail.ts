import { createProjectThumbnail } from "@/lib/projects/createProjectThumbnail";
import type { BlendMode, LoadedImage, WallMask } from "@/types/editor";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

export function createProposalThumbnail(image: LoadedImage, masks: WallMask[], blendMode: BlendMode, placedObjects: PlacedDecorObject[] = []) { return createProjectThumbnail(image, masks, blendMode, placedObjects); }
