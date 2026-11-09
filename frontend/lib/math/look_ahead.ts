import { LookAheadProjection, LookAheadResult } from "../types";
import { calculateStaticDegree } from "./static_degree";
import { circularDifference } from "./rotations";

export function projectFutureAlignments(params: {
  start_date: string;
  price_range: number;
  degree_set?: number;
  horizon_trading_days?: number;
  tolerance?: number;
  price_multiplier?: number;
  time_multiplier?: number;
  convention?: string;
  known_session_dates?: string[];
}): LookAheadResult {
  const {
    start_date,
    price_range,
    degree_set = 90,
    horizon_trading_days = 120,
    tolerance = 4.0,
    price_multiplier = 1.0,
    time_multiplier = 1.0,
    convention = "gann_cardinal_axis",
    known_session_dates
  } = params;

  const pEntry = calculateStaticDegree(price_range, price_multiplier, convention, 4);
  const pAngle = pEntry.static_degree;

  const aspects: [string, number][] =
    degree_set === 60
      ? [
          ["Conjunction (0°)", 0.0],
          ["Sextile (60°)", 60.0],
          ["Trine (120°)", 120.0],
          ["Opposition (180°)", 180.0],
          ["Trine (240°)", 240.0],
          ["Sextile (300°)", 300.0]
        ]
      : [
          ["Conjunction (0°)", 0.0],
          ["Square (90°)", 90.0],
          ["Opposition (180°)", 180.0],
          ["Square (270°)", 270.0]
        ];

  const projections: LookAheadProjection[] = [];
  const startDt = new Date(start_date.split("T")[0]);

  for (let td = 1; td <= horizon_trading_days; td++) {
    const tEntry = calculateStaticDegree(td, time_multiplier, convention, 4);
    const tAngle = tEntry.static_degree;
    const diff = circularDifference(pAngle, tAngle);

    for (const [aspName, aspNominal] of aspects) {
      const orb = Math.abs(diff - aspNominal);
      if (orb <= tolerance) {
        const estCalendarDays = Math.round(td * (7.0 / 5.0));
        let projDateStr: string;

        if (known_session_dates && td < known_session_dates.length) {
          projDateStr = known_session_dates[td];
        } else {
          const futureDate = new Date(startDt.getTime() + estCalendarDays * 86400000);
          projDateStr = futureDate.toISOString().split("T")[0];
        }

        const conf = Math.max(0.0, 100.0 * (1.0 - orb / (tolerance * 1.5)));

        projections.push({
          interval_trading_days: td,
          interval_calendar_days: estCalendarDays,
          projected_date: projDateStr,
          time_static_degree: Number(tAngle.toFixed(2)),
          target_angle: aspNominal,
          aspect_type: aspName,
          orb: Number(orb.toFixed(2)),
          confidence_score: Number(conf.toFixed(1)),
          explanation: `Time (${td} bars -> ${tAngle.toFixed(1)}°) squares with Price (${price_range.toFixed(2)} -> ${pAngle.toFixed(1)}°) at ${aspName}`
        });
        break; // Match strongest aspect per bar
      }
    }
  }

  return {
    start_date,
    price_range: Number(price_range.toFixed(2)),
    price_angle: Number(pAngle.toFixed(2)),
    degree_set,
    horizon_days: horizon_trading_days,
    tolerance,
    projections,
    disclaimer:
      "Look-ahead projections represent mathematical angular synchronizations. " +
      "They are geometric potential turning points and do not constitute guaranteed market reversals."
  };
}
