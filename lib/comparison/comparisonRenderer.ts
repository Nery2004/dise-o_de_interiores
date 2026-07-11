import { exportEditedImage } from "@/lib/exportImage";
import type { BlendMode, LoadedImage, WallMask } from "@/types/editor";
import type { DesignProposal } from "@/types/proposal";

function loadImage(source: string | Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = source instanceof Blob ? URL.createObjectURL(source) : source;
    image.onload = () => {
      if (source instanceof Blob) URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = reject;
    image.src = url;
  });
}
function toBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Canvas export failed")),
      "image/png",
    ),
  );
}
export async function renderProposal(
  image: LoadedImage,
  proposal: DesignProposal,
  blendMode: BlendMode,
) {
  return exportEditedImage({
    image,
    masks: proposal.masksSnapshot,
    globalBlendMode: blendMode,
  });
}
export async function renderSideBySideComparison({
  image,
  masks,
  blendMode,
  split = false,
  includeInfo = false,
  title,
}: {
  image: LoadedImage;
  masks: WallMask[];
  blendMode: BlendMode;
  split?: boolean;
  includeInfo?: boolean;
  title?: string;
}) {
  const [original, edited] = await Promise.all([
    loadImage(image.url),
    exportEditedImage({ image, masks, globalBlendMode: blendMode }).then(
      loadImage,
    ),
  ]);
  const infoHeight = includeInfo ? 70 : 0;
  const canvas = document.createElement("canvas");
  canvas.width = split ? image.dimensions.width : image.dimensions.width * 2;
  canvas.height = image.dimensions.height + infoHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  if (split) {
    context.drawImage(original, 0, 0);
    context.save();
    context.beginPath();
    context.rect(0, 0, image.dimensions.width / 2, image.dimensions.height);
    context.clip();
    context.drawImage(edited, 0, 0);
    context.restore();
    context.fillStyle = "#fff";
    context.fillRect(
      image.dimensions.width / 2 - 2,
      0,
      4,
      image.dimensions.height,
    );
  } else {
    context.drawImage(original, 0, 0);
    context.drawImage(edited, image.dimensions.width, 0);
  }
  if (includeInfo) {
    context.fillStyle = "#fff";
    context.fillRect(0, canvas.height - infoHeight, canvas.width, infoHeight);
    context.fillStyle = "#202124";
    context.font = "24px sans-serif";
    context.fillText(title ?? "Comparación de diseño", 24, canvas.height - 28);
    context.font = "15px sans-serif";
    context.fillStyle = "#69717d";
    context.fillText(new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date()), 24, canvas.height - 8);
    const colors = [...new Set(masks.map((mask) => mask.color).filter((color): color is string => Boolean(color)))];
    colors.slice(0, 8).forEach((color, index) => { context.fillStyle = color; context.beginPath(); context.arc(canvas.width - 28 - index * 30, canvas.height - 35, 10, 0, Math.PI * 2); context.fill(); });
  }
  return toBlob(canvas);
}
export async function renderProposalGrid({
  proposals,
  includeInfo = false,
  title,
}: {
  proposals: DesignProposal[];
  includeInfo?: boolean;
  title?: string;
}) {
  if (proposals.length < 2 || proposals.length > 4)
    throw new Error("Invalid selection");
  const width = 960;
  const cellWidth = width / 2;
  const cellHeight = 340;
  const header = includeInfo ? 70 : 0;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.ceil(proposals.length / 2) * cellHeight + header;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.fillStyle = "#f3f4f6";
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (includeInfo) {
    context.fillStyle = "#202124";
    context.font = "24px sans-serif";
    context.fillText(title ?? "Comparación de propuestas", 24, 42);
  }
  await Promise.all(
    proposals.map(async (proposal, index) => {
      if (!proposal.thumbnail) return;
      const image = await loadImage(proposal.thumbnail);
      const x = (index % 2) * cellWidth;
      const y = Math.floor(index / 2) * cellHeight + header;
      context.drawImage(image, x, y, cellWidth, cellHeight - 44);
      context.fillStyle = "#fff";
      context.fillRect(x, y + cellHeight - 44, cellWidth, 44);
      context.fillStyle = "#202124";
      context.font = "18px sans-serif";
      context.fillText(proposal.name, x + 16, y + cellHeight - 16);
    }),
  );
  return toBlob(canvas);
}
