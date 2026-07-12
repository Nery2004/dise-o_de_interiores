import type { LoadedImage } from "@/types/editor";

export async function loadRoomImageData(image: LoadedImage) {
  const element = await new Promise<HTMLImageElement>((resolve, reject) => {
    const target = new Image();
    target.onload = () => resolve(target);
    target.onerror = () => reject(new Error("ROOM_IMAGE_LOAD_FAILED"));
    target.src = image.url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = image.dimensions.width;
  canvas.height = image.dimensions.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas unavailable");
  context.drawImage(element, 0, 0, canvas.width, canvas.height);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}
