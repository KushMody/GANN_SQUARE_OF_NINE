"""Gann Square of Nine Core Mathematical Engine.

This module provides the core Square of Nine algorithms, price projections,
multipliers, degree factors, and roadmap grid calculations inspired by
TradingFives Square of Nine Roadmap Chart methodology.
"""

from __future__ import annotations
import math
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class RoadmapLevel(BaseModel):
    """Represents a single price level in the roadmap grid."""
    angle: float = Field(..., description="Cumulative angle in degrees (e.g. 45, 90, 180, 360, etc.)")
    cycle: int = Field(..., description="Square of Nine cycle / rotation index (1-based)")
    angle_in_cycle: float = Field(..., description="Angle within the 360° circle (0-360°)")
    price: float = Field(..., description="Calculated roadmap price level")
    delta_price: float = Field(..., description="Price change from base price")
    is_major: bool = Field(..., description="Whether this is a cardinal / major degree level")
    label: str = Field(..., description="Display label, e.g. '90° (Cycle 1)'")


class RoadmapTimeLine(BaseModel):
    """Represents a projected vertical time line."""
    angle: float = Field(..., description="Corresponding angle in degrees")
    bar_index: int = Field(..., description="Bar offset from start pivot")
    projected_date: Optional[str] = Field(None, description="ISO Date string if session calendar is mapped")
    is_major: bool = Field(..., description="Major vs minor time cycle")
    label: str = Field(..., description="Display label, e.g. 'T 90° (+45 bars)'")


class DiagonalChannel(BaseModel):
    """Represents a diagonal roadmap channel or Gann angle."""
    id: str = Field(..., description="Identifier for channel")
    name: str = Field(..., description="Channel name, e.g. '1x1 Bull Main', 'Channel 1 High'")
    start_bar: int = Field(0, description="Start bar index (relative to pivot)")
    start_price: float = Field(..., description="Starting price coordinate")
    end_bar: int = Field(..., description="Ending bar index")
    end_price: float = Field(..., description="Ending price coordinate")
    slope: float = Field(..., description="Price change per bar")
    channel_type: str = Field("main", description="main, upper, lower, harmonic")


class RoadmapGridResult(BaseModel):
    """Complete roadmap grid result for charting overlay."""
    grid_type: str = Field("bull", description="'bull' or 'bear'")
    mode: str = Field("grid", description="'grid' or 'ghost'")
    start_price: float = Field(..., description="Starting pivot price")
    start_date: str = Field(..., description="Starting pivot date YYYY-MM-DD")
    start_time: Optional[str] = Field(None, description="Starting pivot time HH:MM")
    degree_set: int = Field(90, description="90 or 60 degree set")
    degree_factor: float = Field(1.0, description="Degree factor (e.g. 0.8125, 1.0)")
    multiplier: float = Field(1.0, description="Price multiplier")
    calculation_profile: str = Field("standard_gann", description="Calculation profile convention")
    horizontal_levels: List[RoadmapLevel] = Field(default_factory=list)
    vertical_time_lines: List[RoadmapTimeLine] = Field(default_factory=list)
    diagonal_channels: List[DiagonalChannel] = Field(default_factory=list)


def calculate_price_step(
    base_price: float,
    angle: float,
    degree_factor: float = 1.0,
    multiplier: float = 1.0,
    direction: str = "bull",
    calculation_profile: str = "standard_gann"
) -> float:
    """Calculate the Square of Nine price projection for a given angle.
    
    Formula:
        In Gann Square of Nine, a 360° circle corresponds to a root delta of 2.0
        along cardinal rings.
        Normalized angular increment:
            F = (angle / 360.0) * 2.0 * degree_factor
        
        Scaled price:
            P_scaled = base_price * multiplier
        
        For Upward (Bull):
            sqrt(P_next) = sqrt(P_scaled) + F
            P_next = (sqrt(P_next)^2) / multiplier
            
        For Downward (Bear):
            sqrt(P_prev) = sqrt(P_scaled) - F
            If sqrt(P_prev) < 0, clamped to 0.0
            P_prev = (sqrt(P_prev)^2) / multiplier
    """
    if base_price < 0:
        raise ValueError(f"Base price must be non-negative, got {base_price}")
    if multiplier <= 0:
        raise ValueError(f"Multiplier must be strictly positive, got {multiplier}")
    if degree_factor <= 0:
        raise ValueError(f"Degree factor must be strictly positive, got {degree_factor}")

    p_eff = base_price * multiplier
    root_base = math.sqrt(p_eff)

    # Angular increment in root space
    if calculation_profile == "single_cycle":
        # 360° = 1.0 in root space
        f = (angle / 360.0) * 1.0 * degree_factor
    else:
        # Standard Gann / TradingFives 2-units per 360° rotation
        f = (angle / 360.0) * 2.0 * degree_factor

    dir_clean = direction.lower().strip()
    if dir_clean in ("bull", "up", "bullish"):
        root_target = root_base + f
    elif dir_clean in ("bear", "down", "bearish"):
        root_target = max(0.0, root_base - f)
    else:
        raise ValueError(f"Unknown direction '{direction}'. Must be 'bull' or 'bear'.")

    return (root_target ** 2) / multiplier


def generate_roadmap_grid(
    start_price: float,
    start_date: str,
    start_time: Optional[str] = None,
    direction: str = "bull",
    mode: str = "grid",
    degree_set: int = 90,
    degree_factor: float = 1.0,
    multiplier: float = 1.0,
    num_cycles: int = 4,
    time_bar_step_degrees: float = 45.0,
    bars_per_360_deg: int = 90,
    calculation_profile: str = "standard_gann",
    trading_dates: Optional[List[str]] = None
) -> RoadmapGridResult:
    """Generate the full Square of Nine Roadmap Grid.
    
    Parameters:
        start_price: Starting pivot price.
        start_date: YYYY-MM-DD starting pivot date.
        start_time: Optional HH:MM starting pivot time.
        direction: 'bull' or 'bear'.
        mode: 'grid' (standard) or 'ghost' (projected).
        degree_set: 90 or 60.
        degree_factor: Configurable decimal factor (e.g. 0.8125).
        multiplier: Configurable price multiplier.
        num_cycles: Number of 360° cycles to project.
        time_bar_step_degrees: Degrees per vertical time projection line.
        bars_per_360_deg: Number of trading bars equating to one 360° cycle.
        calculation_profile: 'standard_gann' or 'single_cycle'.
        trading_dates: Optional list of forward trading session dates.
    """
    if degree_set not in (90, 60):
        raise ValueError(f"degree_set must be 90 or 60, got {degree_set}")

    # Step angles according to degree set
    if degree_set == 90:
        # Major: 90, 180, 270, 360. Minor sub-intervals: 45
        sub_step = 45.0
        major_steps = {90.0, 180.0, 270.0, 360.0}
    else:
        # Major: 60, 120, 180, 240, 300, 360. Minor sub-intervals: 30
        sub_step = 30.0
        major_steps = {60.0, 120.0, 180.0, 240.0, 300.0, 360.0}

    max_angle = 360.0 * num_cycles
    current_angle = sub_step
    horizontal_levels: List[RoadmapLevel] = []

    while current_angle <= max_angle + 1e-6:
        price = calculate_price_step(
            base_price=start_price,
            angle=current_angle,
            degree_factor=degree_factor,
            multiplier=multiplier,
            direction=direction,
            calculation_profile=calculation_profile
        )
        cycle = int((current_angle - 1e-6) // 360.0) + 1
        angle_in_cycle = ((current_angle - 1e-6) % 360.0) + 1e-6
        is_major = any(abs(angle_in_cycle - m) < 1e-3 for m in major_steps)

        label = f"{int(current_angle)}°" if current_angle.is_integer() else f"{current_angle:.1f}°"
        if is_major:
            label += f" [C{cycle}]"

        horizontal_levels.append(RoadmapLevel(
            angle=current_angle,
            cycle=cycle,
            angle_in_cycle=round(angle_in_cycle, 2),
            price=round(price, 4),
            delta_price=round(price - start_price, 4),
            is_major=is_major,
            label=label
        ))
        current_angle += sub_step

    # Vertical time intervals (Time Projections)
    vertical_time_lines: List[RoadmapTimeLine] = []
    total_time_steps = int(max_angle / time_bar_step_degrees)
    bars_per_degree = bars_per_360_deg / 360.0

    for i in range(1, total_time_steps + 1):
        deg = i * time_bar_step_degrees
        bar_idx = max(1, round(deg * bars_per_degree))
        cycle = int((deg - 1e-6) // 360.0) + 1
        angle_in_cycle = ((deg - 1e-6) % 360.0) + 1e-6
        is_major = any(abs(angle_in_cycle - m) < 1e-3 for m in major_steps)

        proj_date = None
        if trading_dates and bar_idx < len(trading_dates):
            proj_date = trading_dates[bar_idx]

        vertical_time_lines.append(RoadmapTimeLine(
            angle=deg,
            bar_index=bar_idx,
            projected_date=proj_date,
            is_major=is_major,
            label=f"T {int(deg)}° (+{bar_idx}b)"
        ))

    # Diagonal Roadmap Channels (Gann 1x1, 1x2, 2x1 & Corner envelope)
    diagonal_channels: List[DiagonalChannel] = []
    # Identify key 360° and 180° points for channel bounds
    cardinal_levels = [lvl for lvl in horizontal_levels if lvl.is_major]
    if cardinal_levels and vertical_time_lines:
        # Main 1x1 trajectory to 360° price and 360° time
        lvl_360 = next((l for l in horizontal_levels if abs(l.angle - 360.0) < 1e-3), horizontal_levels[-1])
        time_360 = next((t for t in vertical_time_lines if abs(t.angle - 360.0) < 1e-3), vertical_time_lines[-1])

        # 1x1 Main Center Axis
        dx_main = max(1, time_360.bar_index)
        dy_main = lvl_360.price - start_price
        slope_1x1 = dy_main / dx_main

        horizon_bars = max(t.bar_index for t in vertical_time_lines)

        diagonal_channels.append(DiagonalChannel(
            id="channel_1x1_center",
            name=f"1x1 Main ({direction.upper()})",
            start_bar=0,
            start_price=start_price,
            end_bar=horizon_bars,
            end_price=round(start_price + slope_1x1 * horizon_bars, 4),
            slope=round(slope_1x1, 6),
            channel_type="main"
        ))

        # Upper and Lower parallel channel bands (using 90° or 60° harmonic offsets)
        first_major = cardinal_levels[0]
        offset_dy = abs(first_major.price - start_price)

        diagonal_channels.append(DiagonalChannel(
            id="channel_upper_bound",
            name="Upper Channel Band",
            start_bar=0,
            start_price=round(start_price + offset_dy, 4),
            end_bar=horizon_bars,
            end_price=round(start_price + offset_dy + slope_1x1 * horizon_bars, 4),
            slope=round(slope_1x1, 6),
            channel_type="upper"
        ))

        diagonal_channels.append(DiagonalChannel(
            id="channel_lower_bound",
            name="Lower Channel Band",
            start_bar=0,
            start_price=round(max(0.0, start_price - offset_dy), 4),
            end_bar=horizon_bars,
            end_price=round(max(0.0, start_price - offset_dy + slope_1x1 * horizon_bars), 4),
            slope=round(slope_1x1, 6),
            channel_type="lower"
        ))

        # 2x1 and 1x2 secondary harmonic angles
        slope_2x1 = slope_1x1 * 2.0
        slope_1x2 = slope_1x1 * 0.5
        diagonal_channels.append(DiagonalChannel(
            id="channel_2x1_fast",
            name="2x1 Fast Angle",
            start_bar=0,
            start_price=start_price,
            end_bar=horizon_bars,
            end_price=round(start_price + slope_2x1 * horizon_bars, 4),
            slope=round(slope_2x1, 6),
            channel_type="harmonic"
        ))
        diagonal_channels.append(DiagonalChannel(
            id="channel_1x2_slow",
            name="1x2 Slow Angle",
            start_bar=0,
            start_price=start_price,
            end_bar=horizon_bars,
            end_price=round(start_price + slope_1x2 * horizon_bars, 4),
            slope=round(slope_1x2, 6),
            channel_type="harmonic"
        ))

    return RoadmapGridResult(
        grid_type=direction.lower(),
        mode=mode.lower(),
        start_price=start_price,
        start_date=start_date,
        start_time=start_time,
        degree_set=degree_set,
        degree_factor=degree_factor,
        multiplier=multiplier,
        calculation_profile=calculation_profile,
        horizontal_levels=horizontal_levels,
        vertical_time_lines=vertical_time_lines,
        diagonal_channels=diagonal_channels
    )
