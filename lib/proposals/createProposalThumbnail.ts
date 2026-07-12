import { createProjectThumbnail } from "@/lib/projects/createProjectThumbnail";
import type { BlendMode, LoadedImage, WallMask } from "@/types/editor";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import type { RoomLightProfile } from "@/types/lighting";
import type { PlacementSurface } from "@/types/perspective";

export function createProposalThumbnail(image: LoadedImage, masks: WallMask[], blendMode: BlendMode, placedObjects: PlacedDecorObject[] = [], roomLightProfiles: RoomLightProfile[] = [], placementSurfaces: PlacementSurface[] = []) { return createProjectThumbnail(image, masks, blendMode, placedObjects, roomLightProfiles, placementSurfaces); }
