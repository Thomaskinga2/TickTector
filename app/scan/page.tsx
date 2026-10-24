"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { CaptureAnimation, type CaptureSource, type CatchKind } from "@/components/capture-animation";
import { Page } from "@/components/page";
import { ScanResultSheet } from "@/components/scan-result-sheet";
import { ComingSoon, Disclaimer } from "@/components/states";
import { TickScanner, type ScannerLock } from "@/components/tick-scanner";
import { Button } from "@/components/ui/button";
import { openCamera, type CameraOpen } from "@/lib/capture/camera";
import { loadCaptureFonts } from "@/lib/capture/fonts";
import type { Circle } from "@/lib/capture/framing";
import { identifyFrame, type Identified } from "@/lib/capture/identify";
import { thumbnail } from "@/lib/capture/photo";
import { captureText } from "@/lib/capture/scene-text";
import { seededRandom, shuffleTick, STAGE_SCALE, type SimTick } from "@/lib/capture/tick-sim";
import { features } from "@/lib/features";
import { addCatch, peekCatch, type CatchOutcome } from "@/lib/tickdex";

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

type Scan = { id: number; sim: SimTick; recorded: boolean; thumb?: string; identified: Identified | null };

export default function ScanPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [camera, setCamera] = useState<Promise<CameraOpen> | null>(null);
  const [sim, setSim] = useState<SimTick | null>(null);
  const [source, setSource] = useState<CaptureSource | null>(null);
  const [identified, setIdentified] = useState<Identified | null>(null);
  const [outcome, setOutcome] = useState<CatchOutcome | null>(null);
  const [scanId, setScanId] = useState(0);
  const scanRef = useRef<Scan | null>(null);
  const triesRef = useRef(0);

  useEffect(() => {
    loadCaptureFonts(); // warm the canvas fonts while the user is still scanning
  }, []);

  // A tap starts the camera (iPhone Safari wants the gesture) and a fresh, reshuffled tick
  const start = useCallback(() => {
    const seed = new URLSearchParams(window.location.search).get("tickSeed");
    const next = shuffleTick(seed ? seededRandom(Number(seed) + triesRef.current) : Math.random);
    triesRef.current += 1;
    const id = Date.now();
    scanRef.current = { id, sim: next, recorded: false, identified: null };
    setCamera(openCamera());
    setSim(next);
    setSource(null);
    setIdentified(null);
    setOutcome(null);
    setScanId(id);
    setPhase("scanning");
  }, []);

  const onLock = useCallback((lock: ScannerLock) => {
    const scan = scanRef.current;
    // the thumbnail frames the tick at its own size, never tighter than a nymph
    if (scan) scan.thumb = thumbnail(lock.withTick, lock.at, lock.unit * Math.max(0.6, STAGE_SCALE[scan.sim.stage]));
    setSource({ kind: "photo", clean: lock.clean, withTick: lock.withTick, at: lock.at, unit: lock.unit, from: lock.from, circle: lock.circle });
    setPhase("locked");
  }, []);

  const onSample = useCallback((circle: Circle) => {
    if (scanRef.current) scanRef.current.thumb = undefined;
    setSource({ kind: "sample", circle });
    setPhase("locked");
  }, []);

  // The shutter flash: send the frozen frame (with the simulated tick) to /api/scan
  const onShutter = useCallback(() => {
    setPhase("playing");
    const scan = scanRef.current;
    if (!scan) return;
    identifyFrame(source?.kind === "photo" ? source.withTick : samplePhoto()).then((found) => {
      if (scanRef.current?.id !== scan.id) return;
      scan.identified = found;
      setIdentified(found);
    });
  }, [source]);

  // CAUGHT!: record exactly once per scan, then name the slot it filled.
  // The simulated tick is the truth here: the API still runs (and is waited for), but its answer
  // is a mock. TODO: once /api/scan runs a real model, record what it identified instead.
  const onCaught = useCallback((): string => {
    const scan = scanRef.current;
    if (!scan || scan.recorded) return outcome ? headingFor(outcome) : "TICKDEX";
    scan.recorded = true;
    const caught = addCatch({
      speciesId: scan.sim.speciesId,
      speciesName: scan.sim.speciesName,
      stage: scan.sim.stage,
      engorgement: scan.sim.engorgement,
      photo: scan.thumb,
      isBeanDemo: true, // the contract's flag for a demo catch: this one is simulated
    });
    setOutcome(caught);
    return headingFor(caught);
  }, [outcome]);

  // Full catch for a new slot, quick for one already filled; decided once the API has answered
  const catchKind = useMemo((): CatchKind | null => {
    if (!identified || !sim) return null;
    return peekCatch(sim.speciesId, sim.stage).isNewSlot ? "full" : "quick";
  }, [identified, sim]);

  const text = useMemo(
    () => (sim ? captureText(sim, identified !== null, identified?.offline ?? false, source?.kind === "sample") : null),
    [sim, identified, source],
  );

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
          Point your camera at your skin. The scanner finds a tick, you catch it into your Tickdex, and you see where it sits in the tick life
          cycle. Every try is a different tick.
        </p>
        <Button size="lg" className="h-14 w-full text-base" onClick={start}>
          <ScanLine className="size-5" aria-hidden />
          Start scanning
        </Button>
        <p className="text-sm font-medium">Demo: the tick is simulated on your skin.</p>
      </section>
      <Disclaimer />

      {camera && sim && (phase === "scanning" || phase === "locked") && (
        <TickScanner key={scanId} camera={camera} sim={sim} onLock={onLock} onSample={onSample} onClose={() => setPhase("idle")} />
      )}
      {source && text && phase !== "idle" && phase !== "scanning" && (
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
