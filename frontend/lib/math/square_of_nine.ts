import {
  RoadmapLevel,
  RoadmapTimeLine,
  DiagonalChannel,
  RoadmapGridResult
} from "../types";

export function calculatePriceStep(
  basePrice: number,
  angle: number,
  degreeFactor: number = 1.0,
  multiplier: number = 1.0,
  direction: "bull" | "bear" = "bull",
  calculationProfile: string = "standard_gann"
): number {
  if (basePrice < 0) {
    throw new Error(`Base price must be non-negative, got ${basePrice}`);
  }
  if (multiplier <= 0) {
    throw new Error(`Multiplier must be strictly positive, got ${multiplier}`);
  }
  if (degreeFactor <= 0) {
    throw new Error(`Degree factor must be strictly positive, got ${degreeFactor}`);
  }

  const pEff = basePrice * multiplier;
  const rootBase = Math.sqrt(pEff);

  let f: number;
  if (calculationProfile === "single_cycle") {
    f = (angle / 360.0) * 1.0 * degreeFactor;
  } else {
    f = (angle / 360.0) * 2.0 * degreeFactor;
  }

  let rootTarget: number;
  const dirClean = direction.toLowerCase().trim();
  if (dirClean === "bull" || dirClean === "up" || dirClean === "bullish") {
    rootTarget = rootBase + f;
  } else if (dirClean === "bear" || dirClean === "down" || dirClean === "bearish") {
    rootTarget = Math.max(0.0, rootBase - f);
  } else {
    throw new Error(`Unknown direction '${direction}'. Must be 'bull' or 'bear'.`);
  }

  return (rootTarget ** 2) / multiplier;
}

export function generateRoadmapGrid(params: {
  start_price: number;
  start_date: string;
  start_time?: string | null;
  direction?: "bull" | "bear";
  mode?: "grid" | "ghost";
  degree_set?: 90 | 60;
  degree_factor?: number;
  multiplier?: number;
  num_cycles?: number;
  time_bar_step_degrees?: number;
  bars_per_360_deg?: number;
  calculation_profile?: string;
  trading_dates?: string[];
}): RoadmapGridResult {
  const {
    start_price,
    start_date,
    start_time = null,
    direction = "bull",
    mode = "grid",
    degree_set = 90,
    degree_factor = 1.0,
    multiplier = 1.0,
    num_cycles = 4,
    time_bar_step_degrees = 45.0,
    bars_per_360_deg = 90,
    calculation_profile = "standard_gann",
    trading_dates
  } = params;

  if (degree_set !== 90 && degree_set !== 60) {
    throw new Error(`degree_set must be 90 or 60, got ${degree_set}`);
  }

  let subStep = 45.0;
  let majorSteps = new Set([90.0, 180.0, 270.0, 360.0]);
  if (degree_set === 60) {
    subStep = 30.0;
    majorSteps = new Set([60.0, 120.0, 180.0, 240.0, 300.0, 360.0]);
  }

  const maxAngle = 360.0 * num_cycles;
  let currentAngle = subStep;
  const horizontalLevels: RoadmapLevel[] = [];

  while (currentAngle <= maxAngle + 1e-6) {
    const price = calculatePriceStep(
      start_price,
      currentAngle,
      degree_factor,
      multiplier,
      direction,
      calculation_profile
    );
    const cycle = Math.floor((currentAngle - 1e-6) / 360.0) + 1;
    const angleInCycle = ((currentAngle - 1e-6) % 360.0) + 1e-6;
    let isMajor = false;
    for (const m of majorSteps) {
      if (Math.abs(angleInCycle - m) < 1e-3) {
        isMajor = true;
        break;
      }
    }

    let label = Number.isInteger(currentAngle) ? `${currentAngle}°` : `${currentAngle.toFixed(1)}°`;
    if (isMajor) {
      label += ` [C${cycle}]`;
    }

    horizontalLevels.push({
      angle: currentAngle,
      cycle,
      angle_in_cycle: Number(angleInCycle.toFixed(2)),
      price: Number(price.toFixed(4)),
      delta_price: Number((price - start_price).toFixed(4)),
      is_major: isMajor,
      label
    });
    currentAngle += subStep;
  }

  // Vertical time intervals
  const verticalTimeLines: RoadmapTimeLine[] = [];
  const totalTimeSteps = Math.floor(maxAngle / time_bar_step_degrees);
  const barsPerDegree = bars_per_360_deg / 360.0;

  for (let i = 1; i <= totalTimeSteps; i++) {
    const deg = i * time_bar_step_degrees;
    const barIdx = Math.max(1, Math.round(deg * barsPerDegree));
    const angleInCycle = ((deg - 1e-6) % 360.0) + 1e-6;
    let isMajor = false;
    for (const m of majorSteps) {
      if (Math.abs(angleInCycle - m) < 1e-3) {
        isMajor = true;
        break;
      }
    }

    let projDate: string | null = null;
    if (trading_dates && barIdx < trading_dates.length) {
      projDate = trading_dates[barIdx];
    }

    verticalTimeLines.push({
      angle: deg,
      bar_index: barIdx,
      projected_date: projDate,
      is_major: isMajor,
      label: `T ${Math.round(deg)}° (+${barIdx}b)`
    });
  }

  // Diagonal Roadmap Channels
  const diagonalChannels: DiagonalChannel[] = [];
  const cardinalLevels = horizontalLevels.filter((l) => l.is_major);

  if (cardinalLevels.length > 0 && verticalTimeLines.length > 0) {
    const lvl360 = horizontalLevels.find((l) => Math.abs(l.angle - 360.0) < 1e-3) || horizontalLevels[horizontalLevels.length - 1];
    const time360 = verticalTimeLines.find((t) => Math.abs(t.angle - 360.0) < 1e-3) || verticalTimeLines[verticalTimeLines.length - 1];

    const dxMain = Math.max(1, time360.bar_index);
    const dyMain = lvl360.price - start_price;
    const slope1x1 = dyMain / dxMain;
    const horizonBars = Math.max(...verticalTimeLines.map((t) => t.bar_index));

    diagonalChannels.push({
      id: "channel_1x1_center",
      name: `1x1 Main (${direction.toUpperCase()})`,
      start_bar: 0,
      start_price,
      end_bar: horizonBars,
      end_price: Number((start_price + slope1x1 * horizonBars).toFixed(4)),
      slope: Number(slope1x1.toFixed(6)),
      channel_type: "main"
    });

    const firstMajor = cardinalLevels[0];
    const offsetDy = Math.abs(firstMajor.price - start_price);

    diagonalChannels.push({
      id: "channel_upper_bound",
      name: "Upper Channel Band",
      start_bar: 0,
      start_price: Number((start_price + offsetDy).toFixed(4)),
      end_bar: horizonBars,
      end_price: Number((start_price + offsetDy + slope1x1 * horizonBars).toFixed(4)),
      slope: Number(slope1x1.toFixed(6)),
      channel_type: "upper"
    });

    diagonalChannels.push({
      id: "channel_lower_bound",
      name: "Lower Channel Band",
      start_bar: 0,
      start_price: Number(Math.max(0.0, start_price - offsetDy).toFixed(4)),
      end_bar: horizonBars,
      end_price: Number(Math.max(0.0, start_price - offsetDy + slope1x1 * horizonBars).toFixed(4)),
      slope: Number(slope1x1.toFixed(6)),
      channel_type: "lower"
    });

    const slope2x1 = slope1x1 * 2.0;
    const slope1x2 = slope1x1 * 0.5;

    diagonalChannels.push({
      id: "channel_2x1_fast",
      name: "2x1 Fast Angle",
      start_bar: 0,
      start_price,
      end_bar: horizonBars,
      end_price: Number((start_price + slope2x1 * horizonBars).toFixed(4)),
      slope: Number(slope2x1.toFixed(6)),
      channel_type: "harmonic"
    });

    diagonalChannels.push({
      id: "channel_1x2_slow",
      name: "1x2 Slow Angle",
      start_bar: 0,
      start_price,
      end_bar: horizonBars,
      end_price: Number((start_price + slope1x2 * horizonBars).toFixed(4)),
      slope: Number(slope1x2.toFixed(6)),
      channel_type: "harmonic"
    });
  }

  return {
    grid_type: direction,
    mode,
    start_price,
    start_date,
    start_time,
    degree_set,
    degree_factor,
    multiplier,
    calculation_profile,
    horizontal_levels: horizontalLevels,
    vertical_time_lines: verticalTimeLines,
    diagonal_channels: diagonalChannels
  };
}
