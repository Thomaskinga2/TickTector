// The words the capture animation shows for a simulated tick: the ID plate and the result line.
import { STAGE_COPY } from "./diagram-caption";
import { lookFor, type Tick3dLook } from "./draw-tick-3d";
import { shortName, type SimTick } from "./tick-sim";

export type CaptureText = {
  pills: [string, string];
  plateTitle: string | null; // null shows "Identifying..." until the API has answered
  plateSub: string;
  look: Tick3dLook;
  diagram: { stage: SimTick["stage"]; captionLine: string; risk: string; note: string | null; footer: string | null };
};

// Only the deer tick's life cycle is drawn; other species are compared against it
const NOT_LYME = "Not a Lyme carrier";
const COMPARE_NOTE = "Life cycle shown: the deer tick's, for comparison.";

export function captureText(sim: SimTick, answered: boolean, offline: boolean, sample: boolean): CaptureText {
  const stage = STAGE_COPY[sim.stage];
  const name = shortName(sim.speciesName);
  const deer = sim.speciesId === "deer-tick";
  return {
    pills: ["Photo check", sample ? "Sample arm" : "Simulated tick"],
    plateTitle: answered ? `Likely ${name}` : null,
    plateSub: `${stage.name} · ${sim.engorgement} · attached`.toUpperCase(),
    look: lookFor(sim),
    diagram: {
      stage: sim.stage,
      captionLine: `Likely ${name} · ${stage.name} · ${sim.engorgement}`,
      risk: deer ? stage.risk : NOT_LYME,
      note: deer ? (stage.note ?? null) : COMPARE_NOTE,
      footer: offline ? "OFFLINE RESULT" : null,
    },
  };
}
