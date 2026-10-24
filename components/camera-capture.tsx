"use client";

import { Camera } from "lucide-react";
import { ComingSoon } from "@/components/states";
import { buttonVariants } from "@/components/ui/button";
import { features } from "@/lib/features";
import { cn } from "@/lib/utils";

// Opens the rear camera on iPhone; falls back to the photo picker on desktop.
// `inline` is the compact form row version (new post); the default is the big Scan button.
export function CameraCapture({
  onCapture,
  label = "Take a photo",
  disabled = false,
  inline = false,
}: {
  onCapture: (file: File) => void;
  label?: string;
  disabled?: boolean;
  inline?: boolean;
}) {
  if (!features.camera) {
    return inline ? (
      <p className="type-body text-muted-foreground">Photos are coming soon.</p>
    ) : (
      <ComingSoon title="Camera is coming soon" icon={Camera}>
        Taking photos isn&apos;t available yet.
      </ComingSoon>
    );
  }

  return (
    <label
      className={cn(
        inline ? buttonVariants({ variant: "gray", size: "sm" }) : buttonVariants({ size: "lg" }),
        !inline && "w-full",
        "cursor-pointer",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      <Camera aria-hidden />
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
