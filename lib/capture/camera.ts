// Opens the rear camera (or the fake one) and turns camera errors into plain messages.
// Call openCamera straight from a tap: iPhone Safari only grants the camera after one.
import type { FakeCamera } from "./fake-camera";

export type CameraOpen = { ok: true; stream: MediaStream; fake: FakeCamera | null } | { ok: false; message: string };

// About 1280x720 or better, so the circle cut from the frame stays sharp; take what the phone gives
const CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
};

export const MESSAGES = {
  denied: "Camera access is blocked. Allow it for this site in your browser settings, or use a photo instead.",
  missing: "No camera was found on this device. Use a photo instead.",
  busy: "The camera is busy in another app. Close that app and try again, or use a photo instead.",
  insecure: "The camera only works on a secure (https) page. Use a photo instead.",
  failed: "The camera could not start. Use a photo instead.",
};

// ?fakeCamera=1 (a random surface), paper, wood, stone or still: read on the client only, never during prerender
export function fakeCameraMode(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("fakeCamera");
}

function messageFor(err: unknown): string {
  const name = err instanceof Error ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") return MESSAGES.denied;
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "DevicesNotFoundError") return MESSAGES.missing;
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") return MESSAGES.busy;
  return MESSAGES.failed;
}

export async function openCamera(): Promise<CameraOpen> {
  const fakeMode = fakeCameraMode();
  if (fakeMode) {
    try {
      const { startFakeCamera } = await import("./fake-camera");
      const fake = startFakeCamera(fakeMode);
      return { ok: true, stream: fake.stream, fake };
    } catch (err) {
      return { ok: false, message: messageFor(err) };
    }
  }
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { ok: false, message: window.isSecureContext === false ? MESSAGES.insecure : MESSAGES.missing };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
    return { ok: true, stream, fake: null };
  } catch (err) {
    return { ok: false, message: messageFor(err) };
  }
}

export function stopCamera(open: CameraOpen | null): void {
  if (!open?.ok) return;
  open.stream.getTracks().forEach((track) => track.stop());
  open.fake?.stop();
}
