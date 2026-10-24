"use client";

import { Share } from "lucide-react";
import { toast } from "@/components/toaster";
import { cn } from "@/lib/utils";

// The iOS share symbol. Phones get the native share sheet; everywhere else (or if sharing fails) the link is
// copied, and Tick confirms either way. Cancelling the share sheet is not an error and shows nothing.
// `path` shares another page than this one (a post in the forum feed).
export function ShareButton({ title, text, path, className }: { title: string; text?: string; path?: string; className?: string }) {
  async function share() {
    // A clean link: no hash or tracking bits, just the page.
    const url = `${window.location.origin}${path ?? window.location.pathname}`;
    const data = { title, text: text ? `${title}. ${text}` : title, url };

    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      try {
        await navigator.share(data);
        toast("Thanks for sharing!");
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Anything else (blocked, unsupported data): fall through to copying the link.
      }
    }
    toast((await copy(url)) ? "Link copied" : "Couldn't copy the link");
  }

  return (
    <button type="button" onClick={share} aria-label={`Share: ${title}`} className={cn("pressable grid size-11 place-items-center rounded-full", className)}>
      <Share className="size-5" strokeWidth={2.2} aria-hidden />
    </button>
  );
}

// The Clipboard API needs a secure context and permission; the old textarea trick covers the rest.
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}
