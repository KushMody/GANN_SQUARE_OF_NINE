"""Gann Look-Ahead Tool Engine.

Projects future calendar dates and trading-day horizons where angular
conjunctions, squares, oppositions, or trines are mathematically scheduled
to synchronize with previous swing price ranges or angles.
"""

from __future__ import annotations
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from .static_degree import calculate_static_degree
from .rotations import circular_difference


class LookAheadProjection(BaseModel):
    """A projected future time alignment window."""
    interval_trading_days: int = Field(..., description="Trading days from pivot")
    interval_calendar_days: int = Field(..., description="Estimated calendar days from pivot")
    projected_date: str = Field(..., description="Estimated future date (YYYY-MM-DD)")
    time_static_degree: float = Field(..., description="Calculated static degree of this time interval")
    target_angle: float = Field(..., description="Target aspect angle being matched")
    aspect_type: str = Field(..., description="e.g. 'Square (90°)', 'Opposition (180°)', 'Conjunction (0°)'")
    orb: float = Field(..., description="Orb deviation from exact aspect")
    confidence_score: float = Field(..., description="0-100 alignment strength")
    explanation: str = Field(..., description="Clear mathematical breakdown")


class LookAheadResult(BaseModel):
    """Complete look-ahead calculation result."""
    start_date: str = Field(..., description="Starting pivot date YYYY-MM-DD")
    price_range: float = Field(..., description="Reference price range")
    price_angle: float = Field(..., description="Static degree of reference price range")
    degree_set: int = Field(90, description="90 or 60 degree set")
    horizon_days: int = Field(90, description="Maximum projection horizon")
    tolerance: float = Field(4.0, description="Allowed orb tolerance")
    projections: List[LookAheadProjection] = Field(default_factory=list)
    disclaimer: str = Field(
        "Look-ahead projections represent mathematical angular synchronizations. "
        "They are geometric potential turning points and do not constitute guaranteed market reversals."
    )


def project_future_alignments(
    start_date: str,
    price_range: float,
    degree_set: int = 90,
    horizon_trading_days: int = 120,
    tolerance: float = 4.0,
    price_multiplier: float = 1.0,
    time_multiplier: float = 1.0,
    convention: str = "gann_cardinal_axis",
    known_session_dates: Optional[List[str]] = None
) -> LookAheadResult:
    """Compute future dates and trading days that square or harmonize with a reference price range.
    
    Parameters:
        start_date: Starting pivot date YYYY-MM-DD.
        price_range: Previous trend price range.
        degree_set: 90 or 60.
        horizon_trading_days: Projection horizon in trading days (e.g. 60 to 180).
        tolerance: Orb tolerance in degrees.
        price_multiplier: Multiplier for price.
        time_multiplier: Multiplier for time.
        convention: Static degree formula convention.
        known_session_dates: Optional list of actual trading session dates forward.
    """
    p_entry = calculate_static_degree(price_range, price_multiplier, convention, precision=4)
    price_angle = p_entry.static_degree

    if degree_set == 60:
        aspects = [
            ("Conjunction (0°)", 0.0),
            ("Sextile (60°)", 60.0),
            ("Trine (120°)", 120.0),
            ("Opposition (180°)", 180.0),
            ("Trine (240°)", 240.0),
            ("Sextile (300°)", 300.0)
        ]
    else:
        aspects = [
            ("Conjunction (0°)", 0.0),
            ("Square (90°)", 90.0),
            ("Opposition (180°)", 180.0),
            ("Square (270°)", 270.0)
        ]

    projections: List[LookAheadProjection] = []

    # Parse start date
    try:
        dt_start = datetime.strptime(start_date, "%Y-%m-%d")
    except ValueError:
        dt_start = datetime.now()

    # Scan day-by-day across horizon
    for td in range(1, horizon_trading_days + 1):
        td_entry = calculate_static_degree(td, time_multiplier, convention, precision=4)
        t_angle = td_entry.static_degree

        # Shortest circular difference from price angle
        diff = (t_angle - price_angle) % 360.0

        for aspect_name, aspect_deg in aspects:
            orb = circular_difference(diff, aspect_deg)
            if orb <= tolerance:
                # Estimate calendar date:
                # If known session dates list available, pick directly; else approximate 7/5 ratio
                if known_session_dates and td < len(known_session_dates):
                    proj_date_str = known_session_dates[td]
                    cal_days = (datetime.strptime(proj_date_str, "%Y-%m-%d") - dt_start).days
                else:
                    cal_days = round(td * 1.42)  # ~7 calendar days per 5 trading days
                    proj_dt = dt_start + timedelta(days=cal_days)
                    proj_date_str = proj_dt.strftime("%Y-%m-%d")

                confidence = max(0.0, 100.0 * (1.0 - orb / tolerance))

                expl = (
                    f"Day {td} yields static angle {t_angle:.1f}°, forming {aspect_name} "
                    f"with price range {price_range:.2f} (angle {price_angle:.1f}°) with orb {orb:.2f}°."
                )

                projections.append(LookAheadProjection(
                    interval_trading_days=td,
                    interval_calendar_days=cal_days,
                    projected_date=proj_date_str,
                    time_static_degree=round(t_angle, 2),
                    target_angle=aspect_deg,
                    aspect_type=aspect_name,
                    orb=round(orb, 2),
                    confidence_score=round(confidence, 1),
                    explanation=expl
                ))

    # Sort projections by trading day interval
    projections.sort(key=lambda p: p.interval_trading_days)

    return LookAheadResult(
        start_date=start_date,
        price_range=round(price_range, 4),
        price_angle=round(price_angle, 2),
        degree_set=degree_set,
        horizon_days=horizon_trading_days,
        tolerance=tolerance,
        projections=projections
    )
