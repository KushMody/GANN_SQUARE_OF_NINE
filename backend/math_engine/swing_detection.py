"""Historical Swing Detection and Analysis Engine.

Provides automated ZigZag, ATR-threshold, and local extrema swing detection,
manual pivot management, and exact trading-day / calendar-day statistics.
"""

from __future__ import annotations
import math
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class Candle(BaseModel):
    """OHLCV Candle structure."""
    time: str = Field(..., description="Date or timestamp string (YYYY-MM-DD or ISO)")
    open: float
    high: float
    low: float
    close: float
    volume: Optional[float] = 0.0


class SwingPivot(BaseModel):
    """A detected or manual swing pivot point."""
    index: int = Field(..., description="Candle index in the dataset")
    date: str = Field(..., description="Date/time of the pivot")
    price: float = Field(..., description="Pivot price (high or low)")
    pivot_type: str = Field(..., description="'high' or 'low'")
    is_manual: bool = Field(False, description="Whether set manually by user")


class SwingLeg(BaseModel):
    """A completed or active swing between two pivots."""
    start_index: int
    end_index: int
    start_date: str
    end_date: str
    start_price: float
    end_price: float
    price_range: float = Field(..., description="Absolute difference: abs(end_price - start_price)")
    direction: str = Field(..., description="'bullish' or 'bearish'")
    trading_days: int = Field(..., description="Exact number of market session candles")
    calendar_days: int = Field(..., description="Calendar days between start and end dates")
    bars_count: int = Field(..., description="Total bar count between start and end")
    percentage_change: float = Field(..., description="Percentage move")


class SwingAnalysisResult(BaseModel):
    """Result of swing analysis on a price series."""
    pivots: List[SwingPivot] = Field(default_factory=list)
    swings: List[SwingLeg] = Field(default_factory=list)
    active_swing: Optional[SwingLeg] = None


def compute_calendar_days(start_date_str: str, end_date_str: str) -> int:
    """Compute exact calendar days between two dates."""
    # Strip any time component
    d1 = start_date_str.split("T")[0].split(" ")[0]
    d2 = end_date_str.split("T")[0].split(" ")[0]
    try:
        dt1 = datetime.strptime(d1, "%Y-%m-%d")
        dt2 = datetime.strptime(d2, "%Y-%m-%d")
        return abs((dt2 - dt1).days)
    except ValueError:
        return 0


def build_swing_leg(
    start_pivot: SwingPivot,
    end_pivot: SwingPivot,
    candles: Optional[List[Candle]] = None
) -> SwingLeg:
    """Construct a detailed SwingLeg with exact trading days and price range."""
    p_range = abs(end_pivot.price - start_pivot.price)
    direction = "bullish" if end_pivot.price >= start_pivot.price else "bearish"

    # Exact trading days: count of bars between start and end (inclusive of end, matching session count)
    trading_days = abs(end_pivot.index - start_pivot.index)
    bars_count = trading_days

    calendar_days = compute_calendar_days(start_pivot.date, end_pivot.date)

    pct = 0.0
    if start_pivot.price > 0:
        pct = round(((end_pivot.price - start_pivot.price) / start_pivot.price) * 100.0, 2)

    return SwingLeg(
        start_index=start_pivot.index,
        end_index=end_pivot.index,
        start_date=start_pivot.date,
        end_date=end_pivot.date,
        start_price=round(start_pivot.price, 4),
        end_price=round(end_pivot.price, 4),
        price_range=round(p_range, 4),
        direction=direction,
        trading_days=trading_days,
        calendar_days=calendar_days,
        bars_count=bars_count,
        percentage_change=pct
    )


def detect_swings_zigzag(
    candles: List[Candle],
    min_pct_deviation: float = 3.0,
    left_bars: int = 5,
    right_bars: int = 5
) -> SwingAnalysisResult:
    """Detect swing highs and lows using a robust ZigZag and local extrema algorithm.
    
    Parameters:
        candles: Chronological list of OHLC candles.
        min_pct_deviation: Minimum percentage reversal required to confirm a swing.
        left_bars: Left bar confirmation window.
        right_bars: Right bar confirmation window.
    """
    n = len(candles)
    if n < 3:
        return SwingAnalysisResult()

    # Step 1: Identify local fractal extrema
    candidate_pivots: List[SwingPivot] = []

    # Include initial baseline anchor if valid
    initial_min_idx = min(range(min(left_bars * 2, n)), key=lambda k: candles[k].low)
    initial_max_idx = max(range(min(left_bars * 2, n)), key=lambda k: candles[k].high)
    if candles[initial_min_idx].low < candles[initial_max_idx].low:
        candidate_pivots.append(SwingPivot(
            index=initial_min_idx,
            date=candles[initial_min_idx].time,
            price=candles[initial_min_idx].low,
            pivot_type="low"
        ))

    for i in range(left_bars, n - right_bars):
        curr_high = candles[i].high
        curr_low = candles[i].low

        # Check local high
        is_high = True
        for j in range(i - left_bars, i + right_bars + 1):
            if j != i and candles[j].high > curr_high:
                is_high = False
                break
        if is_high:
            candidate_pivots.append(SwingPivot(
                index=i,
                date=candles[i].time,
                price=curr_high,
                pivot_type="high"
            ))

        # Check local low
        is_low = True
        for j in range(i - left_bars, i + right_bars + 1):
            if j != i and candles[j].low < curr_low:
                is_low = False
                break
        if is_low:
            candidate_pivots.append(SwingPivot(
                index=i,
                date=candles[i].time,
                price=curr_low,
                pivot_type="low"
            ))

    # Sort candidates chronologically
    candidate_pivots.sort(key=lambda p: (p.index, 0 if p.pivot_type == "low" else 1))

    # Step 2: Filter with ZigZag alternating logic and minimum percentage move
    filtered_pivots: List[SwingPivot] = []

    for cand in candidate_pivots:
        if not filtered_pivots:
            filtered_pivots.append(cand)
            continue

        last = filtered_pivots[-1]
        if cand.pivot_type == last.pivot_type:
            # Same type: update if more extreme
            if cand.pivot_type == "high" and cand.price > last.price:
                filtered_pivots[-1] = cand
            elif cand.pivot_type == "low" and cand.price < last.price:
                filtered_pivots[-1] = cand
        else:
            # Opposite type: verify minimum percentage deviation
            pct_move = abs(cand.price - last.price) / last.price * 100.0
            if pct_move >= min_pct_deviation:
                filtered_pivots.append(cand)

    # Step 3: Construct swing legs
    swings: List[SwingLeg] = []
    for k in range(len(filtered_pivots) - 1):
        swings.append(build_swing_leg(filtered_pivots[k], filtered_pivots[k + 1], candles))

    # Active unfolding swing (from last pivot to most recent candle)
    active_swing = None
    if filtered_pivots:
        last_pivot = filtered_pivots[-1]
        last_candle = candles[-1]
        active_pivot = SwingPivot(
            index=n - 1,
            date=last_candle.time,
            price=last_candle.close,
            pivot_type="high" if last_candle.close >= last_pivot.price else "low"
        )
        active_swing = build_swing_leg(last_pivot, active_pivot, candles)

    return SwingAnalysisResult(
        pivots=filtered_pivots,
        swings=swings,
        active_swing=active_swing
    )


def detect_swings_atr(
    candles: List[Candle],
    atr_period: int = 14,
    atr_multiplier: float = 2.5
) -> SwingAnalysisResult:
    """ATR-based threshold swing detection."""
    n = len(candles)
    if n < atr_period + 2:
        return SwingAnalysisResult()

    # Calculate True Range & ATR
    tr_list = []
    for i in range(1, n):
        h = candles[i].high
        l = candles[i].low
        prev_c = candles[i - 1].close
        tr = max(h - l, abs(h - prev_c), abs(l - prev_c))
        tr_list.append(tr)

    atr_vals = [tr_list[0]]
    for i in range(1, len(tr_list)):
        current_atr = (atr_vals[-1] * (atr_period - 1) + tr_list[i]) / atr_period
        atr_vals.append(current_atr)

    # Threshold traversal
    pivots: List[SwingPivot] = []
    direction = 1  # 1 for up, -1 for down
    curr_extrema_idx = 0
    curr_extrema_price = candles[0].low

    for i in range(atr_period, n):
        c = candles[i]
        curr_atr = atr_vals[i - 1]
        reversal_threshold = curr_atr * atr_multiplier

        if direction == 1:
            if c.high > curr_extrema_price:
                curr_extrema_price = c.high
                curr_extrema_idx = i
            elif curr_extrema_price - c.low >= reversal_threshold:
                # Reversal to bear confirmed! Record high pivot
                pivots.append(SwingPivot(
                    index=curr_extrema_idx,
                    date=candles[curr_extrema_idx].time,
                    price=curr_extrema_price,
                    pivot_type="high"
                ))
                direction = -1
                curr_extrema_price = c.low
                curr_extrema_idx = i
        else:
            if c.low < curr_extrema_price:
                curr_extrema_price = c.low
                curr_extrema_idx = i
            elif c.high - curr_extrema_price >= reversal_threshold:
                # Reversal to bull confirmed! Record low pivot
                pivots.append(SwingPivot(
                    index=curr_extrema_idx,
                    date=candles[curr_extrema_idx].time,
                    price=curr_extrema_price,
                    pivot_type="low"
                ))
                direction = 1
                curr_extrema_price = c.high
                curr_extrema_idx = i

    swings = []
    for k in range(len(pivots) - 1):
        swings.append(build_swing_leg(pivots[k], pivots[k + 1], candles))

    return SwingAnalysisResult(pivots=pivots, swings=swings)
