import {
  SquaringAspect,
  SquaringEvaluation,
  PriceTimeSquaringResult
} from "../types";
import { calculateStaticDegree } from "./static_degree";
import { circularDifference } from "./rotations";

const SQUARING_METHODS: Record<string, { id: string; name: string; status: string; description: string }> = {
  method_1: {
    id: "method_1",
    name: "Method 1: Previous Trend Price Range vs Current Trend Time",
    status: "verified",
    description: "Compares the price range of the prior swing against the time duration of the current counter-trend or follow-through swing."
  },
  method_2: {
    id: "method_2",
    name: "Method 2: Current Trend Price Range vs Current Trend Time",
    status: "pending_specification",
    description: "In-progress swing squaring: compares the unfolding price range with elapsed time within the active trend."
  },
  method_3: {
    id: "method_3",
    name: "Method 3: Extreme Price vs Extreme Time",
    status: "pending_specification",
    description: "Compares historical macro extreme price against time elapsed from extreme."
  },
  method_4: {
    id: "method_4",
    name: "Method 4: High/Low Price vs Cycle Time",
    status: "pending_specification",
    description: "Tests price level modulo Square of Nine cycles against cycle increments."
  },
  method_5: {
    id: "method_5",
    name: "Method 5: Combined Vector Range vs Cumulative Time",
    status: "pending_specification",
    description: "Multi-wave vector resultant range squared against cumulative multi-leg duration."
  }
};

function evaluateAnglePair(
  priceAngle: number,
  timeAngle: number,
  timeMetric: string,
  timeValue: number,
  tolerance: number = 5.0
): SquaringEvaluation {
  const diff = circularDifference(priceAngle, timeAngle);

  const aspectTargets: [string, number][] = [
    ["Conjunction (0°)", 0.0],
    ["Sextile (60°)", 60.0],
    ["Square (90°)", 90.0],
    ["Trine (120°)", 120.0],
    ["Opposition (180°)", 180.0]
  ];

  const activeAspects: SquaringAspect[] = [];
  let isSquared = false;

  for (const [name, target] of aspectTargets) {
    const orb = Math.abs(diff - target);
    const isActive = orb <= tolerance;
    if (isActive && (target === 0.0 || target === 90.0 || target === 180.0)) {
      isSquared = true;
    }
    if (isActive) {
      activeAspects.push({
        target_aspect: name,
        nominal_difference: target,
        actual_difference: Number(diff.toFixed(2)),
        orb: Number(orb.toFixed(2)),
        is_active: true
      });
    }
  }

  const bestOrb = activeAspects.length > 0
    ? Math.min(...activeAspects.map((a) => a.orb))
    : Math.min(...aspectTargets.map(([_, target]) => Math.abs(diff - target)));

  let score = 0.0;
  if (bestOrb <= tolerance * 2.0) {
    score = Math.max(0.0, 100.0 * (1.0 - bestOrb / (tolerance * 2.0)));
  }

  return {
    time_metric: timeMetric,
    time_value: timeValue,
    time_angle: Number(timeAngle.toFixed(2)),
    price_angle: Number(priceAngle.toFixed(2)),
    angular_difference: Number(diff.toFixed(2)),
    active_aspects: activeAspects,
    is_squared: isSquared,
    harmonic_score: Number(score.toFixed(1))
  };
}

export function calculatePriceTimeSquaring(params: {
  price_range: number;
  trading_days?: number;
  calendar_days?: number;
  intraday_bars?: number;
  method_id?: string;
  price_multiplier?: number;
  time_multiplier?: number;
  tolerance_degrees?: number;
  convention?: string;
}): PriceTimeSquaringResult {
  const {
    price_range,
    trading_days,
    calendar_days,
    intraday_bars,
    method_id = "method_1",
    price_multiplier = 1.0,
    time_multiplier = 1.0,
    tolerance_degrees = 5.0,
    convention = "gann_cardinal_axis"
  } = params;

  const absRange = Math.abs(price_range);
  const methodInfo = SQUARING_METHODS[method_id] || SQUARING_METHODS["method_1"];

  const pEntry = calculateStaticDegree(absRange, price_multiplier, convention, 4);
  const priceAngle = pEntry.static_degree;
  const priceCycle = pEntry.cycle;

  const evaluations: Record<string, SquaringEvaluation> = {};
  let anySquared = false;

  if (trading_days !== undefined && trading_days > 0) {
    const tdEntry = calculateStaticDegree(trading_days, time_multiplier, convention, 4);
    const evalTd = evaluateAnglePair(priceAngle, tdEntry.static_degree, "trading_days", trading_days, tolerance_degrees);
    evaluations["trading_days"] = evalTd;
    if (evalTd.is_squared) anySquared = true;
  }

  if (calendar_days !== undefined && calendar_days > 0) {
    const cdEntry = calculateStaticDegree(calendar_days, time_multiplier, convention, 4);
    const evalCd = evaluateAnglePair(priceAngle, cdEntry.static_degree, "calendar_days", calendar_days, tolerance_degrees);
    evaluations["calendar_days"] = evalCd;
    if (evalCd.is_squared) anySquared = true;
  }

  if (intraday_bars !== undefined && intraday_bars > 0) {
    const barEntry = calculateStaticDegree(intraday_bars, time_multiplier, convention, 4);
    const evalBar = evaluateAnglePair(priceAngle, barEntry.static_degree, "intraday_bars", intraday_bars, tolerance_degrees);
    evaluations["intraday_bars"] = evalBar;
    if (evalBar.is_squared) anySquared = true;
  }

  let verdict: string;
  if (anySquared) {
    const activeNames: string[] = [];
    for (const [k, v] of Object.entries(evaluations)) {
      for (const a of v.active_aspects) {
        activeNames.push(`${k.replace("_", " ")}: ${a.target_aspect} (orb ${a.orb}°)`);
      }
    }
    verdict = `Potential Squaring Active: ${activeNames.join("; ")}.`;
  } else {
    verdict = "No primary squaring aspect active within current tolerance.";
  }

  return {
    method_id: methodInfo.id,
    method_name: methodInfo.name,
    method_status: methodInfo.status,
    price_range: Number(absRange.toFixed(4)),
    price_angle: Number(priceAngle.toFixed(2)),
    price_cycle: priceCycle,
    evaluations,
    primary_squaring_detected: anySquared,
    summary_verdict: verdict
  };
}
