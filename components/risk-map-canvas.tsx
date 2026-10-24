"use client";

// Browser only: Leaflet needs `window`. Load through components/heatmap.tsx, never import directly.
// TickTector's own vector map: Census boundaries (public/map/massachusetts.json) drawn in our palette.
// Leaflet is only the pan/zoom engine; there is no tile server and no third-party map API.
import "leaflet/dist/leaflet.css";
import { LeafletContext, createLeafletContext, type LeafletContextInterface } from "@react-leaflet/core";
import {
  DomEvent,
  Map as LeafletMap,
  divIcon,
  latLngBounds,
  svg,
  type DivIcon,
  type FitBoundsOptions,
  type LatLngBounds,
  type LatLngBoundsExpression,
  type LatLngExpression,
  type MapOptions,
  type Polygon as LeafletPolygon,
  type Renderer,
} from "leaflet";
import { createContext, memo, use, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Expand, Minus, Plus } from "lucide-react";
import { AttributionControl, Marker, Polygon, useMap, useMapEvents } from "react-leaflet";
import { MA_BOUNDS, riskFromIndex, townName } from "@/components/map-utils";
import { RISK_LABEL } from "@/components/risk-badge";
import { LoadingState } from "@/components/states";
import type { HeatmapPoint, RiskLevel } from "@/lib/types";
import { useBasemap, type Basemap } from "@/lib/use-basemap";

// Massachusetts plus a small margin: you can't pan off into the ocean and get lost.
const MAX_BOUNDS: LatLngBoundsExpression = [
  [41.1, -73.65],
  [43.0, -69.75],
];
// Zoomed out, 351 names would pile up: counties are named below town level, towns from here up.
const TOWN_NAMES_FROM_ZOOM = 10;
const COUNTY_NAMES_BELOW_ZOOM = 9.25;

type Props = {
  points: HeatmapPoint[];
  compact: boolean;
  selectedId: string | null;
  onSelect?: (townId: string) => void;
  focusId?: string;
};

type Rings = LatLngExpression[][][];
// GeoJSON is [lng, lat]; Leaflet wants [lat, lng].
const toLatLngs = (coordinates: [number, number][][][]): Rings =>
  coordinates.map((polygon) => polygon.map((ring) => ring.map(([lng, lat]) => [lat, lng] as [number, number])));

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function RiskMapCanvas(props: Props) {
  const { data: basemap, error, onRetry } = useBasemap();
  if (error) {
    return (
      <div className="grid size-full place-items-center p-4 text-center type-subhead text-muted-foreground">
        <span>
          The map couldn&apos;t load.{" "}
          <button type="button" onClick={onRetry} className="font-semibold text-primary">
            Try again
          </button>
        </span>
      </div>
    );
  }
  if (!basemap) {
    return (
      <div className="grid size-full place-items-center">
        <LoadingState label="Loading map…" />
      </div>
    );
  }
  return <VectorMap {...props} basemap={basemap} />;
}

function VectorMap({ basemap, ...props }: Props & { basemap: Basemap }) {
  const interactive = !props.compact;
  const shapes = useMemo(() => townShapes(basemap), [basemap]);
  const focus = props.focusId ? shapes.get(props.focusId) : undefined;

  return (
    <MapRoot
      // The town page frames its town (centered, with its neighbors around it); the full map frames the state.
      bounds={focus ? around(focus.bounds) : MA_BOUNDS}
      boundsOptions={{ padding: props.compact ? [12, 12] : [6, 6] }}
      options={{
        maxBounds: MAX_BOUNDS,
        maxBoundsViscosity: 1,
        minZoom: 7,
        maxZoom: 13,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        zoomControl: false,
        attributionControl: false,
        dragging: interactive,
        touchZoom: interactive,
        doubleClickZoom: interactive,
        // The map sits in a scrolling page; wheel zoom would hijack the scroll. Buttons and pinch still zoom.
        scrollWheelZoom: false,
        boxZoom: interactive,
        keyboard: interactive,
        zoomAnimation: !reducedMotion(),
      }}
      className="size-full"
    >
      <AttributionControl position={props.compact ? "bottomleft" : "bottomright"} prefix={false} />
      {interactive && <MapControls />}
      <Basemap basemap={basemap} />
      <Towns shapes={shapes} {...props} />
      <Labels basemap={basemap} compact={props.compact} />
      <Selection shapes={shapes} {...props} />
    </MapRoot>
  );
}

// Layer panes, bottom to top: land, town shading, then county and coast lines (Leaflet's markers sit at 600).
const PANES = { land: 200, towns: 400, lines: 420 };
type PaneName = keyof typeof PANES;

// One SVG renderer per pane, made with the map and kept as long as it lives. Drawn well past the edges
// (padding 1 = a full view on each side) so shapes never clip while you drag; Leaflet's default is 10%.
type Renderers = Record<PaneName, Renderer>;
const RenderersContext = createContext<Renderers | null>(null);
const useRenderer = (pane: PaneName) => use(RenderersContext)![pane];

// Stands in for react-leaflet's MapContainer, which removes its map whenever its effects clean up but keeps the
// dead map in state. Next keeps visited routes alive in a hidden <Activity> (cacheComponents), which runs those
// cleanups on every tab switch: coming back re-added every layer to a destroyed map, which crashed or drew blank.
// This map, its panes and renderers are made once with the element and never removed. Nothing global holds the
// map (trackResize is off), so it's garbage-collected with the element; the resize observer lives with the effect.
function MapRoot({
  options,
  bounds,
  boundsOptions,
  className,
  children,
}: {
  options: MapOptions;
  bounds: LatLngBoundsExpression;
  boundsOptions: FitBoundsOptions;
  className: string;
  children: ReactNode;
}) {
  const [root, setRoot] = useState<{ context: LeafletContextInterface; renderers: Renderers } | null>(null);
  const created = useRef(false);

  const attach = (node: HTMLDivElement | null) => {
    if (!node || created.current) return;
    created.current = true;
    const map = new LeafletMap(node, { ...options, trackResize: false });
    const renderers = {} as Renderers;
    for (const [pane, zIndex] of Object.entries(PANES) as [PaneName, number][]) {
      map.createPane(pane).style.zIndex = String(zIndex);
      renderers[pane] = svg({ padding: 1, pane });
    }
    map.fitBounds(bounds, boundsOptions);
    setRoot({ context: createLeafletContext(map), renderers });
  };
  const context = root?.context;

  // The frame can change size without the window resizing (layout shifts, rotating a phone, coming back from a
  // hidden route). Leaflet would keep its stale size: gray edges, and taps landing on the wrong town.
  useEffect(() => {
    const map = context?.map;
    if (!map) return;
    const observer = new ResizeObserver(() => map.invalidateSize({ debounceMoveend: true }));
    observer.observe(map.getContainer());
    return () => {
      observer.disconnect();
      map.stop();
    };
  }, [context]);

  return (
    <div ref={attach} className={className}>
      {root && (
        <LeafletContext value={root.context}>
          <RenderersContext value={root.renderers}>{children}</RenderersContext>
        </LeafletContext>
      )}
    </div>
  );
}

type Shape = { rings: Rings; bounds: LatLngBounds; label: [number, number] };

function townShapes(basemap: Basemap) {
  return new Map<string, Shape>(
    basemap.towns.features.map(({ properties, geometry }) => {
      const rings = toLatLngs(geometry.coordinates);
      return [properties.id, { rings, bounds: latLngBounds(rings.flat(2) as [number, number][]), label: [properties.label[1], properties.label[0]] }];
    }),
  );
}

// A frame centered on the town, at least about 30 km across, so its neighbors show around it.
function around(bounds: LatLngBounds): LatLngBoundsExpression {
  const center = bounds.getCenter();
  const halfLat = Math.max((bounds.getNorth() - bounds.getSouth()) * 1.4, 0.13);
  const halfLng = Math.max((bounds.getEast() - bounds.getWest()) * 1.4, 0.2);
  return [
    [center.lat - halfLat, center.lng - halfLng],
    [center.lat + halfLat, center.lng + halfLng],
  ];
}

// Land, neighbors, coast and county lines. Static, so it renders once.
const Basemap = memo(function Basemap({ basemap }: { basemap: Basemap }) {
  const map = useMap();
  const land = useRenderer("land");
  const lines = useRenderer("lines");
  useEffect(() => {
    map.attributionControl?.addAttribution("Boundaries: US Census Bureau");
  }, [map]);
  const neighbors = useMemo(() => basemap.neighbors.features.map((f) => toLatLngs(f.geometry.coordinates)), [basemap]);
  const state = useMemo(() => toLatLngs(basemap.state.geometry.coordinates), [basemap]);
  const counties = useMemo(() => basemap.counties.features.map((f) => toLatLngs(f.geometry.coordinates)), [basemap]);
  return (
    <>
      {neighbors.map((rings, i) => (
        <Polygon key={i} positions={rings} className="map-neighbor" interactive={false} pane="land" renderer={land} />
      ))}
      <Polygon positions={state} className="map-land" interactive={false} pane="land" renderer={land} />
      {counties.map((rings, i) => (
        <Polygon key={i} positions={rings} className="map-county" interactive={false} pane="lines" renderer={lines} />
      ))}
      <Polygon positions={state} className="map-coast" interactive={false} pane="lines" renderer={lines} />
    </>
  );
});

// Every town, shaded by its level this week. Towns outside the current filter stay plain land.
function Towns({ shapes, points, compact, selectedId, onSelect, focusId }: Props & { shapes: Map<string, Shape> }) {
  const levels = useMemo(() => new Map(points.map((p) => [p.townId, riskFromIndex(p.value)])), [points]);
  const highlighted = compact ? focusId : selectedId;
  const renderer = useRenderer("towns");
  return [...shapes].map(([id, shape]) => (
    <Town
      key={id}
      id={id}
      rings={shape.rings}
      level={levels.get(id)}
      selected={id === highlighted}
      interactive={!compact}
      renderer={renderer}
      onSelect={onSelect}
    />
  ));
}

// Each town's path is created once; level, selection and filter only swap its classes in place,
// so nothing remounts, reorders or flickers. (react-leaflet's setStyle ignores className changes.)
const Town = memo(function Town({
  id,
  rings,
  level,
  selected,
  interactive,
  renderer,
  onSelect,
}: {
  id: string;
  rings: Rings;
  level?: RiskLevel;
  selected: boolean;
  interactive: boolean;
  renderer: Renderer;
  onSelect?: (townId: string) => void;
}) {
  const ref = useRef<LeafletPolygon>(null);
  const levelRef = useRef(level);
  useEffect(() => {
    levelRef.current = level;
    const path = ref.current?.getElement();
    if (!path) return;
    for (const l of ["low", "moderate", "high"]) path.classList.toggle(`map-town--${l}`, l === level);
    path.classList.toggle("is-off", !level);
    path.classList.toggle("is-selected", selected);
    // The selected outline draws above its neighbors' hairlines.
    if (selected) ref.current?.bringToFront();
  }, [level, selected]);
  return (
    <Polygon
      ref={ref}
      positions={rings}
      className="map-town"
      interactive={interactive}
      pane="towns"
      renderer={renderer}
      eventHandlers={{ click: () => levelRef.current && onSelect?.(id) }}
    />
  );
});

// County names when zoomed out, town names when zoomed in.
function Labels({ basemap, compact }: { basemap: Basemap; compact: boolean }) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  const [view, setView] = useState(() => map.getBounds());
  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
    moveend: () => setView(map.getBounds()),
  });
  // Bigger places claim their spot first.
  // Keyed by kind: Barnstable, Nantucket and Worcester are each a county and a town.
  const ranks = useMemo(
    () =>
      new Map([
        ...basemap.counties.features.map((f) => [`county:${f.properties.name}`, -footprint(f.geometry.coordinates)] as const),
        ...basemap.towns.features.map((f) => [`town:${f.properties.id}`, -footprint(f.geometry.coordinates)] as const),
      ]),
    [basemap],
  );
  // After the labels (and the pin, added in a sibling's effect) are in place.
  useEffect(() => {
    if (compact) return;
    let cancelled = false;
    queueMicrotask(() => !cancelled && declutter(map.getContainer()));
    return () => {
      cancelled = true;
    };
  });
  if (compact) return null;

  if (zoom < COUNTY_NAMES_BELOW_ZOOM) {
    return basemap.counties.features.map(({ properties }) => (
      <Marker
        key={properties.name}
        position={[properties.label[1], properties.label[0]]}
        icon={labelIcon(properties.name, "county", ranks.get(`county:${properties.name}`) ?? 0)}
        interactive={false}
        keyboard={false}
      />
    ));
  }
  if (zoom < TOWN_NAMES_FROM_ZOOM) return null;
  return basemap.towns.features
    .filter(({ properties }) => view.pad(0.2).contains([properties.label[1], properties.label[0]]))
    .map(({ properties }) => (
      <Marker
        key={properties.id}
        position={[properties.label[1], properties.label[0]]}
        icon={labelIcon(properties.name, "town", ranks.get(`town:${properties.id}`) ?? 0)}
        interactive={false}
        keyboard={false}
      />
    ));
}

// Rough area in square degrees (outer rings only): enough to rank places by size.
function footprint(coordinates: [number, number][][][]) {
  return coordinates.reduce((sum, [ring]) => sum + Math.abs(ring.reduce((a, [x1, y1], i) => {
    const [x2, y2] = ring[(i + 1) % ring.length];
    return a + x1 * y2 - x2 * y1;
  }, 0)) / 2, 0);
}

// Names are laid out biggest place first. One that would run into a name already placed, the pin, or the glass
// controls on top of the map is tried a line higher or lower; one that runs past the frame's side slides back in.
// If nothing fits it's hidden. (At phone width, Berkshire, Hampshire and Worcester ran together, and Nantucket
// was cut off at the edge.)
function declutter(container: HTMLElement) {
  const frame = container.getBoundingClientRect();
  const labels = [...container.querySelectorAll<HTMLElement>(".map-label")].sort((a, b) => Number(a.dataset.rank) - Number(b.dataset.rank));
  for (const label of labels) {
    label.style.translate = "";
    label.style.visibility = "";
  }
  const boxes = labels.map((label) => label.getBoundingClientRect());
  const overlay = container.closest(".risk-map") ?? container;
  type Box = { left: number; right: number; top: number; bottom: number };
  const taken: Box[] = [...overlay.querySelectorAll(".glass, .leaflet-control-attribution, .map-pin")].map((el) => el.getBoundingClientRect());
  const GAP = 3;
  const clear = (b: Box) =>
    b.top >= frame.top &&
    b.bottom <= frame.bottom &&
    taken.every((t) => b.right + GAP <= t.left || b.left - GAP >= t.right || b.bottom + GAP <= t.top || b.top - GAP >= t.bottom);

  labels.forEach((label, i) => {
    const box = boxes[i];
    const dx = Math.max(frame.left + 4 - box.left, 0) + Math.min(frame.right - 4 - box.right, 0);
    for (const dy of [0, -box.height, box.height]) {
      const moved = { left: box.left + dx, right: box.right + dx, top: box.top + dy, bottom: box.bottom + dy };
      if (clear(moved)) {
        if (dx || dy) label.style.translate = `${dx}px ${dy}px`;
        taken.push(moved);
        return;
      }
    }
    label.style.visibility = "hidden";
  });
}

// The selected (or focused) town: a pin with its name, and the camera moves to it.
function Selection({ shapes, points, compact, selectedId, onSelect, focusId }: Props & { shapes: Map<string, Shape> }) {
  const map = useMap();
  const id = compact ? focusId : selectedId;
  const shape = id ? shapes.get(id) : undefined;
  const point = points.find((p) => p.townId === id);
  const level = point && riskFromIndex(point.value);
  // Memoized so the pin (and its pop-in) isn't rebuilt on unrelated renders.
  const icon = useMemo(() => (id && level ? pinIcon(id, level, compact) : null), [id, level, compact]);

  // Move once per new selection, not again when effects re-run (coming back to the tab), which would
  // yank the camera away from wherever you had panned.
  const movedTo = useRef<string | null>(null);
  useEffect(() => {
    // The compact preview keeps its frame; only the full map moves to a selection.
    if (!shape || !id) movedTo.current = null;
    if (!shape || !id || compact || movedTo.current === id) return;
    movedTo.current = id;
    // Leaflet's own zoom: a quick GPU scale straight toward the town. flyTo's 0.7 s arc ran frame by frame while the
    // card mounted below (so it stuttered) and stretched every line about 5× until it landed. Never zoom out to
    // frame a town you're already closer than, and stay put if it's already in view.
    const zoom = Math.max(map.getBoundsZoom(around(shape.bounds)), map.getZoom());
    if (zoom === map.getZoom() && map.getBounds().pad(-0.1).contains(shape.bounds)) return;
    map.setView(shape.bounds.getCenter(), zoom, { animate: !reducedMotion() });
  }, [map, shape, id, compact]);

  if (!shape || !icon || !id) return null;
  return (
    <Marker
      position={shape.label}
      icon={icon}
      interactive={!compact}
      keyboard={!compact}
      zIndexOffset={1000}
      eventHandlers={{ click: () => onSelect?.(id) }}
    />
  );
}

// Icons are cached: a new icon object on every render would make Leaflet rebuild the label's DOM on each pan.
const labelIcons = new Map<string, DivIcon>();
function labelIcon(name: string, kind: "town" | "county", rank: number) {
  const key = `${kind}:${name}`;
  const cached = labelIcons.get(key);
  if (cached) return cached;
  const icon = divIcon({
    className: "map-label-anchor",
    iconSize: [0, 0],
    html: `<span class="map-label map-label--${kind}" data-rank="${rank}" aria-hidden="true">${escapeHtml(name)}</span>`,
  });
  labelIcons.set(key, icon);
  return icon;
}

function pinIcon(townId: string, level: RiskLevel, compact: boolean) {
  const name = escapeHtml(townName(townId));
  const size = compact ? 14 : 22;
  return divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html:
      `<span class="map-pin map-pin--${level} is-selected${compact ? " is-compact" : ""}"><span class="map-pin__dot"></span>` +
      `<span class="map-pin__name" aria-hidden="true">${name}</span>` +
      `<span class="sr-only">${name}, ${RISK_LABEL[level].toLowerCase()} risk</span></span>`,
  });
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

// Zoom and "show all" as our own glass controls (Leaflet's stock buttons don't match iOS and restyle badly on hover).
function MapControls() {
  const map = useMap();
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  // Taps on the controls must not reach the map (no click-to-select, no double-tap zoom behind them).
  useEffect(() => {
    if (!ref.current) return;
    DomEvent.disableClickPropagation(ref.current);
    DomEvent.disableScrollPropagation(ref.current);
  }, []);
  const animate = !reducedMotion();
  const button =
    "grid size-11 place-items-center text-foreground transition-[background-color,opacity] duration-150 hover:bg-fill active:bg-fill disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div ref={ref} className="absolute top-2.5 right-2.5 z-[1000] flex flex-col items-center gap-2">
      <div className="glass flex flex-col overflow-hidden rounded-full">
        <button type="button" aria-label="Zoom in" disabled={zoom >= map.getMaxZoom()} onClick={() => map.zoomIn(1, { animate })} className={button}>
          <Plus className="size-5" strokeWidth={2.4} aria-hidden />
        </button>
        <span aria-hidden className="mx-2.5 h-px bg-separator" />
        <button type="button" aria-label="Zoom out" disabled={zoom <= map.getMinZoom()} onClick={() => map.zoomOut(1, { animate })} className={button}>
          <Minus className="size-5" strokeWidth={2.4} aria-hidden />
        </button>
      </div>
      <button
        type="button"
        aria-label="Show all of Massachusetts"
        onClick={() => (animate ? map.flyToBounds(MA_BOUNDS, { duration: 0.7 }) : map.fitBounds(MA_BOUNDS, { animate: false }))}
        className={`glass rounded-full ${button}`}
      >
        <Expand className="size-[18px]" strokeWidth={2.4} aria-hidden />
      </button>
    </div>
  );
}
