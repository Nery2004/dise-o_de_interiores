import { imageSize } from "image-size";
import { NextResponse } from "next/server";
import { detectWallsFromImage } from "@/lib/server/wallDetectionEngine";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse("La solicitud debe usar multipart/form-data.", 400);
  }

  const image = formData.get("image");

  if (!(image instanceof File)) {
    return errorResponse("Debes enviar una imagen en el campo image.", 400);
  }

  if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
    return errorResponse(
      "Formato inválido. Usa PNG, JPEG o WebP.",
      415,
    );
  }

  if (image.size > MAX_IMAGE_SIZE) {
    return errorResponse("La imagen no debe superar 10 MB.", 413);
  }

  try {
    const buffer = Buffer.from(await image.arrayBuffer());
    const dimensions = imageSize(buffer);

    if (!dimensions.width || !dimensions.height) {
      return errorResponse("No se pudieron leer las dimensiones.", 400);
    }

    const walls = await detectWallsFromImage({
      width: dimensions.width,
      height: dimensions.height,
    });

    return NextResponse.json({ walls });
  } catch {
    return errorResponse("No se pudo procesar la imagen.", 500);
  }
}
