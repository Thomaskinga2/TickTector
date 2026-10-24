"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDragControls, type PanInfo } from "motion/react";
import * as m from "motion/react-m";
import { Loader2 } from "lucide-react";
import { NEW_POST_FORM_ID, NewPostForm } from "@/components/new-post-form";
import { Page } from "@/components/page";
import { Button, buttonVariants } from "@/components/ui/button";
import { createPost } from "@/lib/services/forum";
import { toast } from "@/components/toaster";
import { smooth } from "@/lib/motion";

// Pull the grabber down this far (or flick it) to dismiss, as with iOS sheets.
const DISMISS_PX = 120;
const DISMISS_VELOCITY = 600;

// iOS compose pattern (HIG Sheets): a large-detent sheet with a grabber, Cancel on the leading side,
// and the tinted Post action on the trailing side, enabled once the required fields are filled.
// Drag starts only from the grabber area, so scrolling the form never drags the sheet.
export default function NewPostPage() {
  const router = useRouter();
  const drag = useDragControls();
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const close = () => router.push("/forum");
  const sheetRef = useRef<HTMLDivElement>(null);

  // A dialog takes focus when it opens, and Escape closes it wherever focus is (it used to need focus inside).
  useEffect(() => {
    sheetRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && router.push("/forum");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > DISMISS_PX || info.velocity.y > DISMISS_VELOCITY) close();
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* The backdrop dims in as the sheet rises (it used to be black from the first frame). */}
      <m.div aria-hidden className="absolute inset-0 bg-black" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} />
      {/* The screen underneath, receded behind the sheet as on iOS. */}
      <m.div
        aria-hidden
        className="sheet absolute inset-x-3 top-[env(safe-area-inset-top)] h-4 rounded-t-xl bg-background"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 0.4, y: 0 }}
      />
      <m.div
        ref={sheetRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="New Sighting"
        className="sheet absolute inset-x-0 top-[calc(env(safe-area-inset-top)+0.625rem)] bottom-0 overflow-y-auto outline-none overscroll-contain rounded-t-xl bg-background pb-[env(safe-area-inset-bottom)]"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={smooth}
        drag="y"
        dragControls={drag}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={onDragEnd}
      >
        {/* Grabber: a generous, touch-friendly strip to pull the sheet down. */}
        <div onPointerDown={(e) => drag.start(e)} className="flex h-5 cursor-grab touch-none items-center justify-center active:cursor-grabbing">
          <div aria-hidden className="h-[5px] w-9 rounded-full bg-label-tertiary" />
        </div>
        <Page
          title="New Sighting"
          largeTitle={false}
          inSheet
          leading={
            <Link href="/forum" className={buttonVariants({ variant: "plain", size: "sm", className: "-ml-2 type-body font-normal" })}>
              Cancel
            </Link>
          }
          trailing={
            <Button type="submit" form={NEW_POST_FORM_ID} size="sm" disabled={!ready || submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Post
            </Button>
          }
        >
          <NewPostForm
            onSubmittingChange={setSubmitting}
            onReadyChange={setReady}
            onSubmit={async (input) => {
              await createPost(input);
              toast("Posted. Thanks for the tip!");
              router.push("/forum");
            }}
          />
        </Page>
      </m.div>
    </div>
  );
}
