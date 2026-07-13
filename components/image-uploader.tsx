"use client";

import { ImageUp } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useEditor } from "@/components/editor-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_UPLOAD_BYTES, validateImageUploadMetadata } from "@/lib/images/imageValidation";

export function ImageUploader() {
  const { uploadImage } = useEditor();
  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: MAX_IMAGE_UPLOAD_BYTES,
    maxFiles: 1,
    multiple: false,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];

      if (file) {
        const validation = validateImageUploadMetadata(file);
        if (!validation.valid) { toast.error(validation.message); return; }
        void uploadImage(file);
      }
    },
    onDropRejected: (rejections) => {
      const code = rejections[0]?.errors[0]?.code;
      toast.error(code === "file-too-large" ? "La imagen no debe superar 10 MB." : `Selecciona un archivo ${ALLOWED_IMAGE_TYPES.map((type) => type.split("/")[1].toUpperCase()).join(", ")}.`);
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex h-full min-h-[420px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#cfd6de] bg-white px-6 text-center shadow-sm transition",
        isDragActive && "border-[#1f2421] bg-[#f8faf7]",
      )}
    >
      <input {...getInputProps({ "aria-label": "Seleccionar imagen de la habitación" })} />
      <span className="grid h-16 w-16 place-items-center rounded-full bg-[#edf1f4] text-[#404852]">
        <ImageUp size={28} strokeWidth={1.8} />
      </span>
      <h1 className="mt-5 text-xl font-semibold text-[#202124]">
        Arrastra una imagen aqui
      </h1>
      <p className="mt-2 text-sm text-[#69717d]">o</p>
      <p className="mt-2 text-sm font-medium text-[#30343b]">
        Haz clic para seleccionar
      </p>
      <p className="mt-4 text-xs text-[#89919d]">
        JPG, PNG o WebP para comenzar
      </p>
    </div>
  );
}
