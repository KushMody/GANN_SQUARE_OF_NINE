import { CandleData, SwingPivot, SwingLeg, SwingAnalysisResult } from "../types";

export function computeCalendarDays(startDateStr: string, endDateStr: string): number {
  const d1 = startDateStr.split("T")[0].split(" ")[0];
  const d2 = endDateStr.split("T")[0].split(" ")[0];
  try {
    const dt1 = new Date(d1);
    const dt2 = new Date(d2);
    return Math.abs(Math.round((dt2.getTime() - dt1.getTime()) / 86400000));
  } catch {
    return 0;
  }
}

export function buildSwingLeg(
  startPivot: SwingPivot,
  endPivot: SwingPivot,
  candles?: CandleData[]
): SwingLeg {
  const pRange = Math.abs(endPivot.price - startPivot.price);
  const direction: "bullish" | "bearish" = endPivot.price >= startPivot.price ? "bullish" : "bearish";
  const tradingDays = Math.abs(endPivot.index - startPivot.index);
  const calendarDays = computeCalendarDays(startPivot.date, endPivot.date);

  let pct = 0.0;
  if (startPivot.price > 0) {
    pct = Number((((endPivot.price - startPivot.price) / startPivot.price) * 100.0).toFixed(2));
  }

  return {
    start_index: startPivot.index,
    end_index: endPivot.index,
    start_date: startPivot.date,
    end_date: endPivot.date,
    start_price: Number(startPivot.price.toFixed(4)),
    end_price: Number(endPivot.price.toFixed(4)),
    price_range: Number(pRange.toFixed(4)),
    direction,
    trading_days: tradingDays,
    calendar_days: calendarDays,
    bars_count: tradingDays,
    percentage_change: pct
  };
}

export function detectSwingsZigzag(
  candles: CandleData[],
  minPctDeviation: number = 3.0,
  leftBars: number = 5,
  rightBars: number = 5
): SwingAnalysisResult {
  const n = candles.length;
  if (n < 3) {
    return { pivots: [], swings: [] };
  }

  const candidatePivots: SwingPivot[] = [];

  // Check initial window
  const initWindow = Math.min(leftBars * 2, n);
  let minIdx = 0;
  let maxIdx = 0;
  for (let k = 1; k < initWindow; k++) {
    if (candles[k].low < candles[minIdx].low) minIdx = k;
    if (candles[k].high > candles[maxIdx].high) maxIdx = k;
  }

  if (candles[minIdx].low < candles[maxIdx].low) {
    candidatePivots.push({
      index: minIdx,
      date: candles[minIdx].time,
      price: candles[minIdx].low,
      pivot_type: "low"
    });
  }

  for (let i = leftBars; i < n - rightBars; i++) {
    const currHigh = candles[i].high;
    const currLow = candles[i].low;

    let isHigh = true;
    for (let j = i - leftBars; j <= i + rightBars; j++) {
      if (j !== i && candles[j].high > currHigh) {
        isHigh = false;
        break;
      }
    }
    if (isHigh) {
      candidatePivots.push({
        index: i,
        date: candles[i].time,
        price: currHigh,
        pivot_type: "high"
      });
    }

    let isLow = true;
    for (let j = i - leftBars; j <= i + rightBars; j++) {
      if (j !== i && candles[j].low < currLow) {
        isLow = false;
        break;
      }
    }
    if (isLow) {
      candidatePivots.push({
        index: i,
        date: candles[i].time,
        price: currLow,
        pivot_type: "low"
      });
    }
  }

  candidatePivots.sort((a, b) => {
    if (a.index !== b.index) return a.index - b.index;
    return a.pivot_type === "low" ? -1 : 1;
  });

  const filteredPivots: SwingPivot[] = [];
  for (const cand of candidatePivots) {
    if (filteredPivots.length === 0) {
      filteredPivots.push(cand);
      continue;
    }

    const last = filteredPivots[filteredPivots.length - 1];
    if (cand.pivot_type === last.pivot_type) {
      if (cand.pivot_type === "high" && cand.price > last.price) {
        filteredPivots[filteredPivots.length - 1] = cand;
      } else if (cand.pivot_type === "low" && cand.price < last.price) {
        filteredPivots[filteredPivots.length - 1] = cand;
      }
    } else {
      const pctMove = (Math.abs(cand.price - last.price) / last.price) * 100.0;
      if (pctMove >= minPctDeviation) {
        filteredPivots.push(cand);
      }
    }
  }

  const swings: SwingLeg[] = [];
  for (let k = 0; k < filteredPivots.length - 1; k++) {
    swings.push(buildSwingLeg(filteredPivots[k], filteredPivots[k + 1], candles));
  }

  let activeSwing: SwingLeg | null = null;
  if (filteredPivots.length > 0) {
    const lastPivot = filteredPivots[filteredPivots.length - 1];
    const lastCandle = candles[n - 1];
    const activePivot: SwingPivot = {
      index: n - 1,
      date: lastCandle.time,
      price: lastCandle.close,
      pivot_type: lastCandle.close >= lastPivot.price ? "high" : "low"
    };
    activeSwing = buildSwingLeg(lastPivot, activePivot, candles);
  }

  return {
    pivots: filteredPivots,
    swings,
    active_swing: activeSwing
  };
}

export function detectSwingsAtr(
  candles: CandleData[],
  atrPeriod: number = 14,
  atrMultiplier: number = 2.5
): SwingAnalysisResult {
  const n = candles.length;
  if (n < atrPeriod + 2) {
    return { pivots: [], swings: [] };
  }

  const trList: number[] = [];
  for (let i = 1; i < n; i++) {
    const h = candles[i].high;
    const l = candles[i].low;
    const prevC = candles[i - 1].close;
    trList.push(Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC)));
  }

  const atrVals: number[] = [trList[0]];
  for (let i = 1; i < trList.length; i++) {
    const currentAtr = (atrVals[atrVals.length - 1] * (atrPeriod - 1) + trList[i]) / atrPeriod;
    atrVals.push(currentAtr);
  }

  const pivots: SwingPivot[] = [];
  let direction = 1; // 1 up, -1 down
  let currExtremaIdx = 0;
  let currExtremaPrice = candles[0].low;

  for (let i = atrPeriod; i < n; i++) {
    const c = candles[i];
    const currAtr = atrVals[i - 1];
    const reversalThreshold = currAtr * atrMultiplier;

    if (direction === 1) {
      if (c.high > currExtremaPrice) {
        currExtremaPrice = c.high;
        currExtremaIdx = i;
      } else if (currExtremaPrice - c.low >= reversalThreshold) {
        pivots.push({
          index: currExtremaIdx,
          date: candles[currExtremaIdx].time,
          price: currExtremaPrice,
          pivot_type: "high"
        });
        direction = -1;
        currExtremaPrice = c.low;
        currExtremaIdx = i;
      }
    } else {
      if (c.low < currExtremaPrice) {
        currExtremaPrice = c.low;
        currExtremaIdx = i;
      } else if (c.high - currExtremaPrice >= reversalThreshold) {
        pivots.push({
          index: currExtremaIdx,
          date: candles[currExtremaIdx].time,
          price: currExtremaPrice,
          pivot_type: "low"
        });
        direction = 1;
        currExtremaPrice = c.high;
        currExtremaIdx = i;
      }
    }
  }

  const swings: SwingLeg[] = [];
  for (let k = 0; k < pivots.length - 1; k++) {
    swings.push(buildSwingLeg(pivots[k], pivots[k + 1], candles));
  }

  return { pivots, swings };
}
