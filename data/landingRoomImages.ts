export const LANDING_ROOM_BASE_IMAGE = "/landing/room-base-v2.webp";

const paintedRooms: Record<string, string> = {
  "#A8B5A2": "/landing/room-colors/A8B5A2.webp",
  "#A7BED3": "/landing/room-colors/A7BED3.webp",
  "#C98276": "/landing/room-colors/C98276.webp",
  "#CBC5B9": "/landing/room-colors/CBC5B9.webp",
  "#8FA59A": "/landing/room-colors/8FA59A.webp",
  "#B6AEA1": "/landing/room-colors/B6AEA1.webp",
};

export function getLandingRoomImage(color: string) {
  return paintedRooms[color.toUpperCase()] ?? LANDING_ROOM_BASE_IMAGE;
}
