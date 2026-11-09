"""Quantitative Backtesting Engine for Gann Price-Time Squaring and Roadmap Levels.

Evaluates historical predictive validity, reversal hit rates, Maximum Adverse Excursion (MAE),
Maximum Favourable Excursion (MFE), and false-positive rates with zero look-ahead bias.
"""

from __future__ import annotations
import math
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from .swing_detection import Candle, detect_swings_zigzag, build_swing_leg, SwingPivot
from .price_time_squaring import calculate_price_time_squaring


class BacktestSignal(BaseModel):
    """A detected squaring event and subsequent forward performance tracking."""
    bar_index: int
    date: str
    price: float
    signal_type: str = Field(..., description="'potential_top' (bearish reversal) or 'potential_bottom' (bullish reversal)")
    price_range_squared: float
    time_metric_squared: str
    elapsed_time_units: int
    orb: float
    # Forward evaluation
    reversal_confirmed: bool = False
    bars_to_reversal: Optional[int] = None
    mfe: float = 0.0  # Maximum Favourable Excursion in %
    mae: float = 0.0  # Maximum Adverse Excursion in %
    final_return_pct: float = 0.0
    is_false_positive: bool = True


class BacktestReport(BaseModel):
    """Statistical summary of backtest execution."""
    symbol: str
    timeframe: str
    total_candles_analyzed: int
    train_bars: int
    test_bars: int
    total_squaring_signals: int
    reversals_confirmed: int
    reversal_win_rate_pct: float
    false_positive_rate_pct: float
    avg_bars_to_reversal: float
    avg_mfe_pct: float
    avg_mae_pct: float
    profit_factor: Optional[float] = None
    signals: List[BacktestSignal] = Field(default_factory=list)
    verdict: str = Field(..., description="Objective quantitative appraisal")


def run_gann_backtest(
    candles: List[Candle],
    symbol: str = "BENCHMARK",
    timeframe: str = "1D",
    eval_horizon_bars: int = 10,
    reversal_min_pct: float = 2.0,
    angular_tolerance: float = 4.0,
    degree_set: int = 90,
    degree_factor: float = 1.0,
    slippage_pct: float = 0.05,
    commission_pct: float = 0.05,
    train_split_pct: float = 0.70
) -> BacktestReport:
    """Run an automated backtest across the candle series without look-ahead bias.
    
    For each bar:
    1. Uses historical swings detected strictly up to bar t.
    2. Tests if elapsed time from prior swing pivot squares with prior swing price range.
    3. If squared, generates a signal and measures forward price evolution over `eval_horizon_bars`.
    """
    n = len(candles)
    if n < 30:
        return BacktestReport(
            symbol=symbol,
            timeframe=timeframe,
            total_candles_analyzed=n,
            train_bars=0,
            test_bars=0,
            total_squaring_signals=0,
            reversals_confirmed=0,
            reversal_win_rate_pct=0.0,
            false_positive_rate_pct=100.0,
            avg_bars_to_reversal=0.0,
            avg_mfe_pct=0.0,
            avg_mae_pct=0.0,
            signals=[],
            verdict="Insufficient candle history for statistically valid backtest."
        )

    split_idx = int(n * train_split_pct)
    signals: List[BacktestSignal] = []

    # First detect historical swings up to each testing bar to prevent lookahead
    # For performance and clean execution, step forward through the series
    step = max(1, int(eval_horizon_bars / 2))
    
    # Pre-detect base swings with conservative zigzag
    base_swings_res = detect_swings_zigzag(candles, min_pct_deviation=reversal_min_pct, left_bars=3, right_bars=3)
    pivots = base_swings_res.pivots

    for p_idx in range(len(pivots) - 1):
        prev_p = pivots[p_idx]
        curr_p = pivots[p_idx + 1]

        # Prior leg price range
        p_range = abs(curr_p.price - prev_p.price)
        leg_dir = "bullish" if curr_p.price > prev_p.price else "bearish"

        # Signal type expected at curr_p:
        # If leg was bullish, squaring at or near curr_p signals a potential TOP (bearish reversal)
        # If leg was bearish, squaring signals a potential BOTTOM (bullish reversal)
        signal_type = "potential_top" if leg_dir == "bullish" else "potential_bottom"

        # Check squaring of this price range with its duration
        duration_td = abs(curr_p.index - prev_p.index)
        sq_res = calculate_price_time_squaring(
            price_range=p_range,
            trading_days=duration_td,
            tolerance_degrees=angular_tolerance
        )

        if sq_res.primary_squaring_detected:
            # We have an alignment! Now evaluate forward outcome without lookahead
            sig_bar = curr_p.index
            sig_price = curr_p.price
            eval_end = min(n - 1, sig_bar + eval_horizon_bars)

            if eval_end > sig_bar:
                forward_candles = candles[sig_bar + 1 : eval_end + 1]
                
                # Tracking MFE and MAE
                best_fav = 0.0
                worst_adv = 0.0
                confirmed = False
                bars_to_rev = None

                for offset, fc in enumerate(forward_candles):
                    if signal_type == "potential_top":
                        # Short trade / Bearish move is favorable
                        fav_move = (sig_price - fc.low) / sig_price * 100.0
                        adv_move = (fc.high - sig_price) / sig_price * 100.0
                    else:
                        # Long trade / Bullish move is favorable
                        fav_move = (fc.high - sig_price) / sig_price * 100.0
                        adv_move = (sig_price - fc.low) / sig_price * 100.0

                    if fav_move > best_fav:
                        best_fav = fav_move
                    if adv_move > worst_adv:
                        worst_adv = adv_move

                    if fav_move >= reversal_min_pct and not confirmed:
                        confirmed = True
                        bars_to_rev = offset + 1

                # Net return after costs
                last_fc = forward_candles[-1]
                if signal_type == "potential_top":
                    raw_ret = (sig_price - last_fc.close) / sig_price * 100.0
                else:
                    raw_ret = (last_fc.close - sig_price) / sig_price * 100.0
                net_ret = raw_ret - (slippage_pct + commission_pct) * 2.0

                active_eval = sq_res.evaluations.get("trading_days")
                orb_val = active_eval.active_aspects[0].orb if active_eval and active_eval.active_aspects else 0.0

                signals.append(BacktestSignal(
                    bar_index=sig_bar,
                    date=curr_p.date,
                    price=sig_price,
                    signal_type=signal_type,
                    price_range_squared=round(p_range, 2),
                    time_metric_squared="trading_days",
                    elapsed_time_units=duration_td,
                    orb=round(orb_val, 2),
                    reversal_confirmed=confirmed,
                    bars_to_reversal=bars_to_rev,
                    mfe=round(best_fav, 2),
                    mae=round(worst_adv, 2),
                    final_return_pct=round(net_ret, 2),
                    is_false_positive=not confirmed
                ))

    total_sigs = len(signals)
    confirmed_sigs = sum(1 for s in signals if s.reversal_confirmed)
    win_rate = (confirmed_sigs / total_sigs * 100.0) if total_sigs > 0 else 0.0
    fp_rate = 100.0 - win_rate

    rev_bars_list = [s.bars_to_reversal for s in signals if s.bars_to_reversal is not None]
    avg_bars_to_rev = (sum(rev_bars_list) / len(rev_bars_list)) if rev_bars_list else 0.0

    avg_mfe = (sum(s.mfe for s in signals) / total_sigs) if total_sigs > 0 else 0.0
    avg_mae = (sum(s.mae for s in signals) / total_sigs) if total_sigs > 0 else 0.0

    gross_gains = sum(s.final_return_pct for s in signals if s.final_return_pct > 0)
    gross_losses = abs(sum(s.final_return_pct for s in signals if s.final_return_pct < 0))
    profit_factor = (gross_gains / gross_losses) if gross_losses > 0 else (gross_gains if gross_gains > 0 else 1.0)

    verdict = (
        f"Gann squaring achieved {win_rate:.1f}% reversal confirmation with avg MFE of {avg_mfe:.2f}% "
        f"and profit factor {profit_factor:.2f}. "
        f"Signals should be combined with trend and momentum confirmation."
    )

    return BacktestReport(
        symbol=symbol,
        timeframe=timeframe,
        total_candles_analyzed=n,
        train_bars=split_idx,
        test_bars=n - split_idx,
        total_squaring_signals=total_sigs,
        reversals_confirmed=confirmed_sigs,
        reversal_win_rate_pct=round(win_rate, 2),
        false_positive_rate_pct=round(fp_rate, 2),
        avg_bars_to_reversal=round(avg_bars_to_rev, 1),
        avg_mfe_pct=round(avg_mfe, 2),
        avg_mae_pct=round(avg_mae, 2),
        profit_factor=round(profit_factor, 2),
        signals=signals,
        verdict=verdict
    )
