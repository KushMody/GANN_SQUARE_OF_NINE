import { StaticDegreeEntry, StaticDegreeTableResponse } from "../types";

export function calculateStaticDegree(
  value: number,
  multiplier: number = 1.0,
  convention: string = "gann_cardinal_axis",
  precision: number = 4
): StaticDegreeEntry {
  if (value < 0) {
    throw new Error(`Value must be non-negative, got ${value}`);
  }
  if (multiplier <= 0) {
    throw new Error(`Multiplier must be positive, got ${multiplier}`);
  }

  const scaled = value * multiplier;
  const root = Math.sqrt(scaled);

  let cycle: number;
  let deg: number;

  if (convention === "fractional_root") {
    cycle = Math.max(1, Math.floor(root));
    const frac = root - Math.floor(root);
    deg = (frac * 360.0) % 360.0;
  } else if (convention === "direct_180") {
    cycle = Math.max(1, Math.floor(root / 2.0) + 1);
    deg = ((root % 2.0) * 180.0) % 360.0;
  } else {
    // 'gann_cardinal_axis' (Default)
    const deltaRoot = root - 1.0;
    if (deltaRoot < 0) {
      cycle = 1;
      deg = 0.0;
    } else {
      cycle = Math.floor(deltaRoot / 2.0) + 1;
      deg = ((deltaRoot % 2.0) * 180.0) % 360.0;
    }
  }

  // Quadrants
  let quadrant = 1;
  if (deg < 90.0) quadrant = 1;
  else if (deg < 180.0) quadrant = 2;
  else if (deg < 270.0) quadrant = 3;
  else quadrant = 4;

  // Cardinal Aspects
  let cardinal: string | null = null;
  if (deg <= 2.5 || deg >= 357.5) {
    cardinal = "0° / 360° (Conjunction)";
  } else if (Math.abs(deg - 90.0) <= 2.5) {
    cardinal = "90° (Square)";
  } else if (Math.abs(deg - 180.0) <= 2.5) {
    cardinal = "180° (Opposition)";
  } else if (Math.abs(deg - 270.0) <= 2.5) {
    cardinal = "270° (Square)";
  }

  // Trine / Sextile Aspects
  let trine: string | null = null;
  if (Math.abs(deg - 60.0) <= 2.5) {
    trine = "60° (Sextile)";
  } else if (Math.abs(deg - 120.0) <= 2.5) {
    trine = "120° (Trine)";
  } else if (Math.abs(deg - 240.0) <= 2.5) {
    trine = "240° (Trine)";
  } else if (Math.abs(deg - 300.0) <= 2.5) {
    trine = "300° (Sextile)";
  }

  return {
    value: Number(value.toFixed(precision)),
    sqrt_value: Number(root.toFixed(precision)),
    cycle,
    static_degree: Number(deg.toFixed(precision)),
    quadrant,
    cardinal_aspect: cardinal,
    trine_aspect: trine,
  };
}

export function generateStaticDegreeTable(
  startVal: number = 1,
  endVal: number = 1000,
  multiplier: number = 1.0,
  convention: string = "gann_cardinal_axis",
  precision: number = 2
): StaticDegreeTableResponse {
  const entries: StaticDegreeEntry[] = [];
  const startInt = Math.max(1, Math.floor(startVal));
  const endInt = Math.min(10000, Math.floor(endVal));

  for (let v = startInt; v <= endInt; v++) {
    entries.push(calculateStaticDegree(v, multiplier, convention, precision));
  }

  return {
    convention,
    formula_description: "Gann Cardinal Axis: odd squares at 0°/360°, even squares at 180°",
    multiplier,
    precision,
    total_entries: entries.length,
    entries,
  };
}
