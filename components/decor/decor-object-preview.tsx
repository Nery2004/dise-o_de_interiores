"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useState } from "react";
import { decorCategoryLabels, type DecorObject } from "@/types/decor-object";

const reportedAssets = new Set<string>();

function reportMissingAsset(url: string) {
  if (reportedAssets.has(url)) return;
  reportedAssets.add(url);
  console.warn(`[DecorObjects] No se pudo cargar el asset local: ${url}`);
}

export function DecorObjectPreview({
  object,
  detail = false,
  className = "",
  sizes,
}: {
  object: DecorObject;
  detail?: boolean;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const source = detail ? object.assetUrl : object.thumbnailUrl;
  if (failed) return (
    <div className={`grid place-items-center bg-[linear-gradient(145deg,#f4f0e7,#e5dfd3)] text-center text-[#697169] ${className}`} role="img" aria-label={`Vista no disponible de ${object.name}`}>
      <span className="grid gap-2 place-items-center px-4"><ImageOff size={28} /><span className="text-xs font-semibold">{decorCategoryLabels[object.category]}</span></span>
    </div>
  );
  return <Image src={source} alt={`${object.name}, objeto decorativo ${decorCategoryLabels[object.category].toLocaleLowerCase("es")}`} width={detail ? object.width : 320} height={detail ? object.height : 320} sizes={sizes ?? (detail ? "(max-width: 768px) 90vw, 520px" : "(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 220px")} loading="lazy" onError={() => { reportMissingAsset(source); setFailed(true); }} className={`object-contain ${className}`} />;
}
