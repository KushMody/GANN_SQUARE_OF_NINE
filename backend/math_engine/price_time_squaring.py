"""Price-Time Squaring Calculation Engine.

Implements Gann Price-Time Squaring principles, converting price ranges and
time durations into Square of Nine angular values and detecting conjunctions,
oppositions, squares, and trine harmonics.
"""

from __future__ import annotations
import math
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from .static_degree import calculate_static_degree


class SquaringAspect(BaseModel):
    """Identified aspect between price and time angles."""
    target_aspect: str = Field(..., description="Name, e.g. 'Square (90°)', 'Opposition (180°)'")
    nominal_difference: float = Field(..., description="0, 60, 90, 120, 180, etc.")
    actual_difference: float = Field(..., description="Actual absolute angular difference")
    orb: float = Field(..., description="Deviation from exact aspect (degrees)")
    is_active: bool = Field(..., description="True if within tolerance orb")


class SquaringEvaluation(BaseModel):
    """Result of price-time squaring comparison."""
    time_metric: str = Field(..., description="trading_days, calendar_days, or bars")
    time_value: float = Field(..., description="Input duration value")
    time_angle: float = Field(..., description="Calculated static degree for time")
    price_angle: float = Field(..., description="Calculated static degree for price")
    angular_difference: float = Field(..., description="Circular shortest difference (0-180°)")
    active_aspects: List[SquaringAspect] = Field(default_factory=list)
    is_squared: bool = Field(False, description="Whether an active cardinal square or conjunction exists")
    harmonic_score: float = Field(0.0, description="0 to 100% alignment score")


class PriceTimeSquaringResult(BaseModel):
    """Complete price-time squaring analysis."""
    method_id: str = Field("method_1", description="Squaring method ID")
    method_name: str = Field(..., description="Name of the method used")
    method_status: str = Field("verified", description="'verified' or 'pending_specification'")
    price_range: float = Field(..., description="Price range analyzed")
    price_angle: float = Field(..., description="Price angular value")
    price_cycle: int = Field(..., description="Square of Nine cycle of price")
    evaluations: Dict[str, SquaringEvaluation] = Field(default_factory=dict)
    primary_squaring_detected: bool = Field(False)
    summary_verdict: str = Field(..., description="Human-readable synthesis")


SQUARING_METHODS = {
    "method_1": {
        "id": "method_1",
        "name": "Method 1: Previous Trend Price Range vs Current Trend Time",
        "status": "verified",
        "description": "Compares the price range of the prior swing against the time duration of the current counter-trend or follow-through swing."
    },
    "method_2": {
        "id": "method_2",
        "name": "Method 2: Current Trend Price Range vs Current Trend Time",
        "status": "pending_specification",
        "description": "In-progress swing squaring: compares the unfolding price range with elapsed time within the active trend."
    },
    "method_3": {
        "id": "method_3",
        "name": "Method 3: Extreme Price vs Extreme Time",
        "status": "pending_specification",
        "description": "Compares historical macro extreme price (major high or low) against time elapsed from extreme."
    },
    "method_4": {
        "id": "method_4",
        "name": "Method 4: High/Low Price vs Cycle Time",
        "status": "pending_specification",
        "description": "Tests price level modulo Square of Nine cycles against planetary or solar seasonal cycle increments."
    },
    "method_5": {
        "id": "method_5",
        "name": "Method 5: Combined Vector Range vs Cumulative Time",
        "status": "pending_specification",
        "description": "Multi-wave vector resultant range squared against cumulative multi-leg duration."
    }
}


def circular_difference(angle1: float, angle2: float) -> float:
    """Calculate the shortest circular distance between two angles (0 to 180°)."""
    diff = abs(angle1 - angle2) % 360.0
    if diff > 180.0:
        diff = 360.0 - diff
    return diff


def evaluate_angle_pair(
    price_angle: float,
    time_angle: float,
    time_metric: str,
    time_value: float,
    tolerance: float = 5.0
) -> SquaringEvaluation:
    """Evaluate whether price angle and time angle form a significant aspect."""
    diff = circular_difference(price_angle, time_angle)

    aspect_targets = [
        ("Conjunction (0°)", 0.0),
        ("Sextile (60°)", 60.0),
        ("Square (90°)", 90.0),
        ("Trine (120°)", 120.0),
        ("Opposition (180°)", 180.0)
    ]

    active_aspects: List[SquaringAspect] = []
    is_squared = False
    min_orb = 180.0

    for name, target in aspect_targets:
        orb = abs(diff - target)
        if orb < min_orb:
            min_orb = orb
        is_active = orb <= tolerance
        if is_active and target in (0.0, 90.0, 180.0):
            is_squared = True
        active_aspects.append(SquaringAspect(
            target_aspect=name,
            nominal_difference=target,
            actual_difference=round(diff, 2),
            orb=round(orb, 2),
            is_active=is_active
        ))

    # Calculate harmonic score (100% when exact orb 0, drops off linearly to 0 at tolerance * 2)
    best_orb = min(a.orb for a in active_aspects)
    if best_orb <= tolerance * 2.0:
        score = max(0.0, 100.0 * (1.0 - best_orb / (tolerance * 2.0)))
    else:
        score = 0.0

    return SquaringEvaluation(
        time_metric=time_metric,
        time_value=time_value,
        time_angle=round(time_angle, 2),
        price_angle=round(price_angle, 2),
        angular_difference=round(diff, 2),
        active_aspects=[a for a in active_aspects if a.is_active],
        is_squared=is_squared,
        harmonic_score=round(score, 1)
    )


def calculate_price_time_squaring(
    price_range: float,
    trading_days: Optional[int] = None,
    calendar_days: Optional[int] = None,
    intraday_bars: Optional[int] = None,
    method_id: str = "method_1",
    price_multiplier: float = 1.0,
    time_multiplier: float = 1.0,
    tolerance_degrees: float = 5.0,
    convention: str = "gann_cardinal_axis"
) -> PriceTimeSquaringResult:
    """Execute Price-Time Squaring analysis.
    
    Parameters:
        price_range: Absolute price distance of the reference swing.
        trading_days: Number of market trading days elapsed.
        calendar_days: Number of calendar days elapsed.
        intraday_bars: Number of intraday bars elapsed (optional).
        method_id: One of method_1 ... method_5.
        price_multiplier: Price scale multiplier.
        time_multiplier: Time scale multiplier.
        tolerance_degrees: Allowed orb tolerance for alignment (e.g. ±5.0°).
        convention: Static degree formula convention.
    """
    if price_range < 0:
        price_range = abs(price_range)

    method_info = SQUARING_METHODS.get(method_id, SQUARING_METHODS["method_1"])

    # Price static degree
    p_entry = calculate_static_degree(price_range, price_multiplier, convention, precision=4)
    price_angle = p_entry.static_degree
    price_cycle = p_entry.cycle

    evaluations: Dict[str, SquaringEvaluation] = {}
    any_squared = False

    if trading_days is not None and trading_days > 0:
        td_entry = calculate_static_degree(trading_days, time_multiplier, convention, precision=4)
        eval_td = evaluate_angle_pair(
            price_angle, td_entry.static_degree, "trading_days", trading_days, tolerance_degrees
        )
        evaluations["trading_days"] = eval_td
        if eval_td.is_squared:
            any_squared = True

    if calendar_days is not None and calendar_days > 0:
        cd_entry = calculate_static_degree(calendar_days, time_multiplier, convention, precision=4)
        eval_cd = evaluate_angle_pair(
            price_angle, cd_entry.static_degree, "calendar_days", calendar_days, tolerance_degrees
        )
        evaluations["calendar_days"] = eval_cd
        if eval_cd.is_squared:
            any_squared = True

    if intraday_bars is not None and intraday_bars > 0:
        bar_entry = calculate_static_degree(intraday_bars, time_multiplier, convention, precision=4)
        eval_bar = evaluate_angle_pair(
            price_angle, bar_entry.static_degree, "intraday_bars", intraday_bars, tolerance_degrees
        )
        evaluations["intraday_bars"] = eval_bar
        if eval_bar.is_squared:
            any_squared = True

    # Summary synthesis
    if any_squared:
        active_names = []
        for k, v in evaluations.items():
            for a in v.active_aspects:
                active_names.append(f"{k.replace('_', ' ').title()}: {a.target_aspect} (orb {a.orb}°)")
        verdict = f"Potential Squaring Active: {'; '.join(active_names)}."
    else:
        verdict = "No primary squaring aspect active within current tolerance."

    return PriceTimeSquaringResult(
        method_id=method_info["id"],
        method_name=method_info["name"],
        method_status=method_info["status"],
        price_range=round(price_range, 4),
        price_angle=round(price_angle, 2),
        price_cycle=price_cycle,
        evaluations=evaluations,
        primary_squaring_detected=any_squared,
        summary_verdict=verdict
    )
