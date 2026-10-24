"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { BeanScanner, type ScannerLock } from "@/components/bean-scanner";
import { CaptureAnimation, type CaptureSource, type CatchKind } from "@/components/capture-animation";
import { Page } from "@/components/page";
import { ScanResultSheet } from "@/components/scan-result-sheet";
import { ComingSoon, Disclaimer } from "@/components/states";
import { Button } from "@/components/ui/button";
import { openCamera, type CameraOpen } from "@/lib/capture/camera";
import { STAGE_COPY } from "@/lib/capture/diagram-caption";
import { loadCaptureFonts } from "@/lib/capture/fonts";
import { engorgementOf, identifyFrame, shortSpecies, stageOf, type Identified } from "@/lib/capture/identify";
import { thumbnail } from "@/lib/capture/photo";
import { features } from "@/lib/features";
import { addCatch, peekCatch, speciesIdFor, type CatchOutcome } from "@/lib/tickdex";

// idle -> scanning -> locked -> opening -> playing -> result
type Phase = "idle" | "scanning" | "locked" | "opening" | "playing" | "result";

const SAMPLE_PHOTO_SIZE = 160;

function headingFor(o: CatchOutcome): string {
  if (o.dexNumber === 0) return "TICKDEX · NOT IN THE DEX · LOGGED";
  const what = o.isNewSpecies ? "NEW SPECIES" : o.isNewSlot ? "NEW STAGE" : "LOGGED AGAIN";
  return `TICKDEX · NO. ${String(o.dexNumber).padStart(3, "0")} · ${what}`;
}

// The sample has no photo; a small skin-coloured square keeps it on the same API path
function samplePhoto(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = SAMPLE_PHOTO_SIZE;
  c.height = SAMPLE_PHOTO_SIZE;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#dfa983";
    ctx.fillRect(0, 0, SAMPLE_PHOTO_SIZE, SAMPLE_PHOTO_SIZE);
  }
  return c;
}

export default function ScanPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [camera, setCamera] = useState<Promise<CameraOpen> | null>(null);
  const [source, setSource] = useState<CaptureSource | null>(null);
  const [identified, setIdentified] = useState<Identified | null>(null);
  const [outcome, setOutcome] = useState<CatchOutcome | null>(null);
  const [scanId, setScanId] = useState(0);
  const scanRef = useRef({ id: 0, recorded: false, thumb: undefined as string | undefined, identified: null as Identified | null });

  useEffect(() => {
    loadCaptureFonts(); // warm the canvas fonts while the user is still scanning
  }, []);

  // A tap starts the camera (iPhone Safari wants the gesture) and a fresh scan
  const start = useCallback(() => {
    setCamera(openCamera());
    setSource(null);
    setIdentified(null);
    setOutcome(null);
    setScanId((n) => n + 1);
    setPhase("scanning");
  }, []);

  useEffect(() => {
    scanRef.current = { id: scanId, recorded: false, thumb: undefined, identified: null };
  }, [scanId]);

  const onLock = useCallback((lock: ScannerLock) => {
    scanRef.current.thumb = thumbnail(lock.frame, lock.bean);
    setSource({ kind: "photo", ...lock });
    setPhase("locked");
  }, []);

  const onSample = useCallback((circle: { x: number; y: number; r: number }) => {
    scanRef.current.thumb = undefined;
    setSource({ kind: "sample", circle });
    setPhase("locked");
  }, []);

  // The shutter flash: send the frozen frame to /api/scan
  const onShutter = useCallback(() => {
    setPhase("playing");
    const id = scanRef.current.id;
    const frame = source?.kind === "photo" ? source.frame : samplePhoto();
    identifyFrame(frame).then((found) => {
      if (scanRef.current.id !== id) return;
      scanRef.current.identified = found;
      setIdentified(found);
    });
  }, [source]);

  // CAUGHT!: record exactly once per scan, then name what it filled
  const onCaught = useCallback((): string => {
    const scan = scanRef.current;
    const found = scan.identified;
    if (!found || scan.recorded) return outcome ? headingFor(outcome) : "TICKDEX";
    scan.recorded = true;
    const { result } = found;
    const caught = addCatch({
      speciesId: speciesIdFor(result.species),
      speciesName: result.species ?? "Unidentified tick",
      stage: stageOf(result),
      engorgement: engorgementOf(result),
      photo: scan.thumb,
      isBeanDemo: true,
    });
    setOutcome(caught);
    return headingFor(caught);
  }, [outcome]);

  // Full catch for a new slot, quick for one already filled
  const catchKind = useMemo((): CatchKind | null => {
    if (!identified) return null;
    const { result } = identified;
    return peekCatch(speciesIdFor(result.species), stageOf(result)).isNewSlot ? "full" : "quick";
  }, [identified]);

  const text = useMemo(() => {
    const r = identified?.result ?? null;
    const stage = r ? stageOf(r) : "adult";
    const fed = r ? engorgementOf(r) : "partly fed";
    const name = shortSpecies(r?.species ?? null);
    const sample = source?.kind === "sample";
    return {
      pills: ["Photo check", sample ? "Left forearm · Amherst, MA" : "Bean demo"] as [string, string],
      plateTitle: r ? `Likely ${name}` : null,
      plateSub: `${STAGE_COPY[stage].name} · ${fed} · attached`.toUpperCase(),
      diagram: {
        stage,
        captionLine: `Likely ${name} · ${STAGE_COPY[stage].name} · ${fed}`,
        footer: identified?.offline ? "OFFLINE RESULT · SAMPLE DATA" : null,
      },
    };
  }, [identified, source]);

  if (!features.camera) {
    return (
      <Page title="Scan a tick">
        <ComingSoon title="Camera">Taking photos is coming soon.</ComingSoon>
      </Page>
    );
  }

  return (
    <Page title="Scan a tick">
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-5">
        <p className="text-muted-foreground">
          Point your camera at the tick. When it is found, it is caught into your Tickdex and you see where it sits in the deer tick life
          cycle.
        </p>
        <Button size="lg" className="h-14 w-full text-base" onClick={start}>
          <ScanLine className="size-5" aria-hidden />
          Start scanning
        </Button>
        <p className="text-sm font-medium">Demo: a bean stands in for a tick.</p>
      </section>
      <Disclaimer />

      {camera && (phase === "scanning" || phase === "locked") && (
        <BeanScanner key={scanId} camera={camera} onLock={onLock} onSample={onSample} onClose={() => setPhase("idle")} />
      )}
      {source && phase !== "idle" && phase !== "scanning" && (
        <CaptureAnimation
          key={`anim-${scanId}`}
          source={source}
          text={text}
          hasResult={identified !== null}
          catchKind={catchKind}
          onReady={() => setPhase((p) => (p === "locked" ? "opening" : p))}
          onShutter={onShutter}
          onCaught={onCaught}
          onFinished={() => setPhase("result")}
          showSkip={phase !== "result"}
        />
      )}
      {phase === "result" && <ScanResultSheet entryId={outcome?.entry.id ?? null} offline={identified?.offline ?? false} onScanAgain={start} />}
    </Page>
  );
}
