import type { PlacedDecorObject } from "@/types/placed-decor-object";
import type { PlacementSurface } from "@/types/perspective";
import type { InteriorProject } from "@/types/project";
import type { RoomLightProfile } from "@/types/lighting";
import type { ObjectGroup } from "@/types/object-group";

type ReferenceScope = {
  objects: PlacedDecorObject[];
  groups: ObjectGroup[];
  surfaces: PlacementSurface[];
  profiles: RoomLightProfile[];
};

function sanitizeScope({ objects, groups, surfaces, profiles }: ReferenceScope) {
  const objectIds = new Set(objects.map((object) => object.id));
  const surfaceIds = new Set(surfaces.map((surface) => surface.id));
  const profileIds = new Set(profiles.map((profile) => profile.id));
  const assignedObjectIds = new Set<string>();
  const sanitizedGroups = groups.flatMap((group) => {
    const memberIds = Array.from(new Set(group.objectIds)).filter(
      (id) => objectIds.has(id) && !assignedObjectIds.has(id),
    );
    if (memberIds.length < 2) return [];
    memberIds.forEach((id) => assignedObjectIds.add(id));
    return [{ ...group, objectIds: memberIds }];
  });
  const groupByObjectId = new Map<string, string>();
  sanitizedGroups.forEach((group) =>
    group.objectIds.forEach((id) => groupByObjectId.set(id, group.id)),
  );

  return {
    groups: sanitizedGroups,
    objects: objects.map((object) => ({
      ...object,
      groupId: groupByObjectId.get(object.id),
      lightProfileId:
        object.lightProfileId && profileIds.has(object.lightProfileId)
          ? object.lightProfileId
          : undefined,
      surfaceId:
        object.surfaceId && surfaceIds.has(object.surfaceId)
          ? object.surfaceId
          : undefined,
    })),
  };
}

/**
 * Clears recoverable dangling references without mutating imported or stored data.
 * Structural corruption and invalid numeric values remain validation errors.
 */
export function sanitizeProjectReferences(
  project: InteriorProject,
): InteriorProject {
  const main = sanitizeScope({
    objects: project.placedObjects,
    groups: project.objectGroups,
    surfaces: project.placementSurfaces,
    profiles: project.roomLightProfiles,
  });
  const profileIds = new Set(project.roomLightProfiles.map((profile) => profile.id));
  const maskIds = new Set(project.masks.map((mask) => mask.id));

  return {
    ...project,
    activeRoomLightProfileId:
      project.activeRoomLightProfileId &&
      profileIds.has(project.activeRoomLightProfileId)
        ? project.activeRoomLightProfileId
        : undefined,
    selectedMaskId:
      project.selectedMaskId && maskIds.has(project.selectedMaskId)
        ? project.selectedMaskId
        : null,
    placedObjects: main.objects,
    objectGroups: main.groups,
    proposals: project.proposals.map((proposal) => {
      const proposalProfiles = proposal.roomLightProfileSnapshot
        ? [proposal.roomLightProfileSnapshot]
        : [];
      const proposalScope = sanitizeScope({
        objects: proposal.placedObjectsSnapshot,
        groups: proposal.objectGroupsSnapshot,
        surfaces: proposal.placementSurfacesSnapshot,
        profiles: proposalProfiles,
      });
      return {
        ...proposal,
        placedObjectsSnapshot: proposalScope.objects,
        objectGroupsSnapshot: proposalScope.groups,
      };
    }),
  };
}
