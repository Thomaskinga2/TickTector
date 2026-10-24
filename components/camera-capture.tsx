"use client";

import { Camera } from "lucide-react";
import { ComingSoon } from "@/components/states";
import { buttonVariants } from "@/components/ui/button";
import { features } from "@/lib/features";
import { cn } from "@/lib/utils";

// Opens the rear camera on iPhone; falls back to the photo picker on desktop.
export function CameraCapture({
  onCapture,
  label = "Take a photo",
  disabled = false,
}: {
  onCapture: (file: File) => void;
  label?: string;
  disabled?: boolean;
}) {
  if (!features.camera) return <ComingSoon title="Camera">Taking photos is coming soon.</ComingSoon>;

  return (
    <label className={cn(buttonVariants({ size: "lg" }), "h-14 w-full cursor-pointer text-base", disabled && "pointer-events-none opacity-50")}>
      <Camera className="size-5" aria-hidden />
      {label}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onCapture(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}
