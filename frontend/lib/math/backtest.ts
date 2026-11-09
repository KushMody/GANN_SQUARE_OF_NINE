import { CandleData, BacktestSignal, BacktestReport } from "../types";
import { detectSwingsZigzag } from "./swing_detection";
import { calculatePriceTimeSquaring } from "./price_time_squaring";

export function runGannBacktest(params: {
  candles: CandleData[];
  symbol?: string;
  timeframe?: string;
  eval_horizon_bars?: number;
  reversal_min_pct?: number;
  angular_tolerance?: number;
  degree_set?: number;
  degree_factor?: number;
  slippage_pct?: number;
  commission_pct?: number;
  train_split_pct?: number;
}): BacktestReport {
  const {
    candles,
    symbol = "BENCHMARK",
    timeframe = "1D",
    eval_horizon_bars = 10,
    reversal_min_pct = 2.0,
    angular_tolerance = 4.0,
    slippage_pct = 0.05,
    commission_pct = 0.05,
    train_split_pct = 0.70
  } = params;

  const n = candles.length;
  if (n < 30) {
    return {
      symbol,
      timeframe,
      total_candles_analyzed: n,
      train_bars: 0,
      test_bars: 0,
      total_squaring_signals: 0,
      reversals_confirmed: 0,
      reversal_win_rate_pct: 0.0,
      false_positive_rate_pct: 100.0,
      avg_bars_to_reversal: 0.0,
      avg_mfe_pct: 0.0,
      avg_mae_pct: 0.0,
      signals: [],
      verdict: "Insufficient candle history for statistically valid backtest."
    };
  }

  const splitIdx = Math.floor(n * train_split_pct);
  const signals: BacktestSignal[] = [];

  const baseSwings = detectSwingsZigzag(candles, reversal_min_pct, 3, 3);
  const pivots = baseSwings.pivots;

  for (let pIdx = 0; pIdx < pivots.length - 1; pIdx++) {
    const prevP = pivots[pIdx];
    const currP = pivots[pIdx + 1];

    const pRange = Math.abs(currP.price - prevP.price);
    const legDir = currP.price > prevP.price ? "bullish" : "bearish";
    const signalType = legDir === "bullish" ? "potential_top" : "potential_bottom";
    const durationTd = Math.abs(currP.index - prevP.index);

    const sqRes = calculatePriceTimeSquaring({
      price_range: pRange,
      trading_days: durationTd,
      tolerance_degrees: angular_tolerance
    });

    if (sqRes.primary_squaring_detected) {
      const sigBar = currP.index;
      const sigPrice = currP.price;
      const evalEnd = Math.min(n - 1, sigBar + eval_horizon_bars);

      if (evalEnd > sigBar) {
        const forwardCandles = candles.slice(sigBar + 1, evalEnd + 1);

        let bestFav = 0.0;
        let worstAdv = 0.0;
        let confirmed = false;
        let barsToRev: number | null = null;

        for (let offset = 0; offset < forwardCandles.length; offset++) {
          const fc = forwardCandles[offset];
          let favMove: number;
          let advMove: number;

          if (signalType === "potential_top") {
            favMove = ((sigPrice - fc.low) / sigPrice) * 100.0;
            advMove = ((fc.high - sigPrice) / sigPrice) * 100.0;
          } else {
            favMove = ((fc.high - sigPrice) / sigPrice) * 100.0;
            advMove = ((sigPrice - fc.low) / sigPrice) * 100.0;
          }

          if (favMove > bestFav) bestFav = favMove;
          if (advMove > worstAdv) worstAdv = advMove;

          if (favMove >= reversal_min_pct && !confirmed) {
            confirmed = true;
            barsToRev = offset + 1;
          }
        }

        const lastFc = forwardCandles[forwardCandles.length - 1];
        let rawRet: number;
        if (signalType === "potential_top") {
          rawRet = ((sigPrice - lastFc.close) / sigPrice) * 100.0;
        } else {
          rawRet = ((lastFc.close - sigPrice) / sigPrice) * 100.0;
        }
        const netRet = rawRet - (slippage_pct + commission_pct) * 2.0;

        const activeEval = sqRes.evaluations["trading_days"];
        const orbVal = activeEval && activeEval.active_aspects.length > 0 ? activeEval.active_aspects[0].orb : 0.0;

        signals.push({
          bar_index: sigBar,
          date: currP.date,
          price: sigPrice,
          signal_type: signalType,
          price_range_squared: Number(pRange.toFixed(2)),
          time_metric_squared: "trading_days",
          elapsed_time_units: durationTd,
          orb: Number(orbVal.toFixed(2)),
          reversal_confirmed: confirmed,
          bars_to_reversal: barsToRev,
          mfe: Number(bestFav.toFixed(2)),
          mae: Number(worstAdv.toFixed(2)),
          final_return_pct: Number(netRet.toFixed(2)),
          is_false_positive: !confirmed
        });
      }
    }
  }

  const totalSigs = signals.length;
  const confirmedSigs = signals.filter((s) => s.reversal_confirmed).length;
  const winRate = totalSigs > 0 ? (confirmedSigs / totalSigs) * 100.0 : 0.0;
  const fpRate = 100.0 - winRate;

  const revBarsList = signals.map((s) => s.bars_to_reversal).filter((b): b is number => b !== null && b !== undefined);
  const avgBarsToRev = revBarsList.length > 0 ? revBarsList.reduce((a, b) => a + b, 0) / revBarsList.length : 0.0;

  const avgMfe = totalSigs > 0 ? signals.reduce((a, s) => a + s.mfe, 0) / totalSigs : 0.0;
  const avgMae = totalSigs > 0 ? signals.reduce((a, s) => a + s.mae, 0) / totalSigs : 0.0;

  const grossGains = signals.filter((s) => s.final_return_pct > 0).reduce((a, s) => a + s.final_return_pct, 0);
  const grossLosses = Math.abs(signals.filter((s) => s.final_return_pct < 0).reduce((a, s) => a + s.final_return_pct, 0));
  const profitFactor = grossLosses > 0 ? grossGains / grossLosses : grossGains > 0 ? grossGains : 1.0;

  const verdict =
    `Gann squaring achieved ${winRate.toFixed(1)}% reversal confirmation with avg MFE of ${avgMfe.toFixed(2)}% ` +
    `and profit factor ${profitFactor.toFixed(2)}. Signals should be combined with trend and momentum confirmation.`;

  return {
    symbol,
    timeframe,
    total_candles_analyzed: n,
    train_bars: splitIdx,
    test_bars: n - splitIdx,
    total_squaring_signals: totalSigs,
    reversals_confirmed: confirmedSigs,
    reversal_win_rate_pct: Number(winRate.toFixed(2)),
    false_positive_rate_pct: Number(fpRate.toFixed(2)),
    avg_bars_to_reversal: Number(avgBarsToRev.toFixed(1)),
    avg_mfe_pct: Number(avgMfe.toFixed(2)),
    avg_mae_pct: Number(avgMae.toFixed(2)),
    profit_factor: Number(profitFactor.toFixed(2)),
    signals,
    verdict
  };
}
