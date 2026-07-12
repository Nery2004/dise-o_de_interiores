import { clamp, normalizeDirection } from "@/lib/lighting/lightProfile";
import type { ProjectedShadowGeometry, RoomLightProfile } from "@/types/lighting";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import type { PlacementSurface } from "@/types/perspective";

export function calculateShadowTransform(
  object: PlacedDecorObject,
  lightProfile?: RoomLightProfile,
) {
  const settings = object.shadowSettings!;
  const direction = settings.autoDirection
    ? normalizeDirection(lightProfile?.direction ?? { x: 0.7, y: 0.7 })
    : normalizeDirection({ x: settings.offsetX, y: settings.offsetY });
  const elevation = (lightProfile?.elevation ?? 55) * (Math.PI / 180);
  const estimatedHeight = object.height * (0.4 + object.depth * 0.3);
  const length = clamp(estimatedHeight / Math.max(0.35, Math.tan(elevation)), 3, object.height * 0.85);
  return {
    offsetX: settings.autoDirection ? direction.x * length : settings.offsetX,
    offsetY: settings.autoDirection ? direction.y * length : settings.offsetY,
    scaleX: clamp(settings.scaleX, 0.1, 3),
    scaleY: clamp(settings.scaleY * (0.75 + object.depth * 0.35), 0.08, 2),
    rotation: settings.rotation + Math.atan2(direction.y, direction.x) * (180 / Math.PI) - 90,
  };
}

export function createProjectedShadow(
  object: PlacedDecorObject,
  _surface?: PlacementSurface,
  lightProfile?: RoomLightProfile,
): ProjectedShadowGeometry | null {
  const settings = object.shadowSettings;
  if (!settings?.enabled || !["projected", "both"].includes(settings.type)) return null;
  const transform = calculateShadowTransform(object, lightProfile);
  const wall = object.surfaceType === "wall";
  const strength = (lightProfile?.shadowStrength ?? 50) / 50;
  return {
    center: { x: object.x, y: object.y },
    width: object.width,
    height: object.height,
    blur: clamp(wall ? Math.min(settings.blur, 10) : settings.blur, 0, 40),
    opacity: clamp(settings.opacity * strength, 0, wall ? 0.32 : 0.55),
    color: settings.color,
    ...transform,
    offsetX: wall ? clamp(transform.offsetX, -12, 12) : transform.offsetX,
    offsetY: wall ? clamp(transform.offsetY, -12, 12) : transform.offsetY,
    scaleY: wall ? 1 : transform.scaleY,
  };
}
