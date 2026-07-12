import { clamp } from "@/lib/lighting/lightProfile";
import { objectAnchorPoint } from "@/lib/perspective/objectAnchoring";
import type { ContactShadowGeometry, RoomLightProfile } from "@/types/lighting";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import type { PlacementSurface } from "@/types/perspective";

export function createContactShadow(
  object: PlacedDecorObject,
  surface?: PlacementSurface,
  lightProfile?: RoomLightProfile,
): ContactShadowGeometry | null {
  const settings = object.shadowSettings;
  if (!settings?.enabled || !["contact", "both"].includes(settings.type)) return null;
  if (object.surfaceType === "wall" || object.surfaceType === "ceiling") return null;
  const anchor = objectAnchorPoint(object);
  const surfacePerspective = surface?.points.length
    ? clamp(0.55 + object.depth * 0.55, 0.45, 1.05)
    : 1;
  const profileStrength = (lightProfile?.shadowStrength ?? 50) / 50;
  return {
    center: { x: anchor.x, y: anchor.y + object.baseContactOffset },
    width: clamp(object.width * settings.contactWidth * surfacePerspective, 2, object.width * 1.25),
    height: clamp(object.height * settings.contactHeight * (0.7 + object.depth * 0.3), 1.5, object.height * 0.22),
    rotation: object.rotation + settings.rotation * 0.2,
    blur: clamp(settings.contactBlur, 0, 30),
    opacity: clamp(settings.contactOpacity * profileStrength, 0, 0.6),
    color: settings.color,
  };
}
