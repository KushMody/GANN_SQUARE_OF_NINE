"""Static Degree Table and Conversion Engine.

Provides static degree lookups, interpolation for decimal values,
table generation up to 1000+, CSV export, and configurable calculation conventions.
"""

from __future__ import annotations
import math
import io
import csv
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class StaticDegreeEntry(BaseModel):
    """A single row in the Static Degree Table."""
    value: float = Field(..., description="The input number (price or time)")
    sqrt_value: float = Field(..., description="Square root of the value")
    cycle: int = Field(..., description="Square of Nine ring / cycle number")
    static_degree: float = Field(..., description="Calculated static angle in degrees (0-360°)")
    quadrant: int = Field(..., description="Quadrant 1 (0-90°), 2 (90-180°), 3 (180-270°), 4 (270-360°)")
    cardinal_aspect: Optional[str] = Field(None, description="0° (Conjunction), 90° (Square), 180° (Opposition), 270° (Square)")
    trine_aspect: Optional[str] = Field(None, description="60° (Sextile), 120° (Trine), 240° (Trine), 300° (Sextile)")


class StaticDegreeTableResponse(BaseModel):
    """Metadata and paginated or full table output."""
    convention: str = Field(..., description="Calculation convention identifier")
    formula_description: str = Field(..., description="Detailed formula explanation")
    multiplier: float = Field(1.0, description="Applied multiplier")
    precision: int = Field(2, description="Rounding decimal precision")
    total_entries: int = Field(..., description="Total rows in range")
    entries: List[StaticDegreeEntry] = Field(default_factory=list)


def calculate_static_degree(
    value: float,
    multiplier: float = 1.0,
    convention: str = "gann_cardinal_axis",
    precision: int = 4
) -> StaticDegreeEntry:
    """Calculate the static degree of any number (integer or floating point).
    
    Conventions:
    1. 'gann_cardinal_axis' (Default):
       Formula: angle = (((sqrt(value * multiplier) - 1.0) % 2.0) * 180.0) % 360.0
       Aligns odd squares (1, 9, 25, 49...) at 0°/360° and even squares (4, 16, 36...) at 180°.
       Cycle = floor((sqrt(value * multiplier) - 1.0) / 2.0) + 1.
    2. 'fractional_root':
       Formula: angle = (sqrt(value * multiplier) - floor(sqrt(value * multiplier))) * 360.0
       Cycle = floor(sqrt(value * multiplier)).
    3. 'direct_180':
       Formula: angle = ((sqrt(value * multiplier) % 2.0) * 180.0) % 360.0
    """
    if value < 0:
        raise ValueError(f"Value must be non-negative, got {value}")
    if multiplier <= 0:
        raise ValueError(f"Multiplier must be positive, got {multiplier}")

    scaled = value * multiplier
    root = math.sqrt(scaled)

    if convention == "fractional_root":
        cycle = max(1, int(math.floor(root)))
        frac = root - math.floor(root)
        deg = (frac * 360.0) % 360.0
    elif convention == "direct_180":
        cycle = max(1, int(math.floor(root / 2.0)) + 1)
        deg = ((root % 2.0) * 180.0) % 360.0
    else:  # 'gann_cardinal_axis' (Default)
        delta_root = root - 1.0
        if delta_root < 0:
            cycle = 1
            deg = 0.0
        else:
            cycle = int(math.floor(delta_root / 2.0)) + 1
            deg = ((delta_root % 2.0) * 180.0) % 360.0

    # Quadrant 1: 0-90, 2: 90-180, 3: 180-270, 4: 270-360
    if deg < 90.0:
        quadrant = 1
    elif deg < 180.0:
        quadrant = 2
    elif deg < 270.0:
        quadrant = 3
    else:
        quadrant = 4

    # Aspects within ±2.5° tolerance
    cardinal = None
    if deg <= 2.5 or deg >= 357.5:
        cardinal = "0° / 360° (Conjunction)"
    elif abs(deg - 90.0) <= 2.5:
        cardinal = "90° (Square)"
    elif abs(deg - 180.0) <= 2.5:
        cardinal = "180° (Opposition)"
    elif abs(deg - 270.0) <= 2.5:
        cardinal = "270° (Square)"

    trine = None
    if abs(deg - 60.0) <= 2.5:
        trine = "60° (Sextile)"
    elif abs(deg - 120.0) <= 2.5:
        trine = "120° (Trine)"
    elif abs(deg - 240.0) <= 2.5:
        trine = "240° (Trine)"
    elif abs(deg - 300.0) <= 2.5:
        trine = "300° (Sextile)"

    return StaticDegreeEntry(
        value=round(value, precision),
        sqrt_value=round(root, precision),
        cycle=cycle,
        static_degree=round(deg, precision),
        quadrant=quadrant,
        cardinal_aspect=cardinal,
        trine_aspect=trine
    )


def interpolate_static_degree(
    val: float,
    multiplier: float = 1.0,
    convention: str = "gann_cardinal_axis",
    precision: int = 4
) -> Dict[str, Any]:
    """Calculate exact and adjacent interpolated static degrees for non-integer inputs."""
    exact = calculate_static_degree(val, multiplier, convention, precision)
    lower_int = math.floor(val)
    upper_int = math.ceil(val)

    lower_entry = calculate_static_degree(lower_int, multiplier, convention, precision)
    upper_entry = calculate_static_degree(upper_int, multiplier, convention, precision)

    # Angular interpolation with circular wrapping
    fraction = val - lower_int if upper_int > lower_int else 0.0

    return {
        "input_value": val,
        "exact_entry": exact.model_dump(),
        "lower_integer_entry": lower_entry.model_dump(),
        "upper_integer_entry": upper_entry.model_dump(),
        "fraction": round(fraction, 4),
        "convention": convention
    }


def generate_static_degree_table(
    start_val: int = 1,
    end_val: int = 1000,
    step: int = 1,
    multiplier: float = 1.0,
    convention: str = "gann_cardinal_axis",
    precision: int = 2
) -> StaticDegreeTableResponse:
    """Generate static degree table for a range of integer values."""
    if start_val < 1:
        start_val = 1
    if end_val < start_val:
        end_val = start_val + 100

    formula_desc = (
        "Gann Cardinal Axis: Angle = [((sqrt(N * mult) - 1) mod 2) * 180°] mod 360°. "
        "Odd squares (1, 9, 25, 49, 81...) anchor at 0°/360°, even squares (4, 16, 36...) at 180°."
    )
    if convention == "fractional_root":
        formula_desc = "Fractional Root: Angle = (sqrt(N * mult) - floor(sqrt(N * mult))) * 360°."
    elif convention == "direct_180":
        formula_desc = "Direct 180: Angle = ((sqrt(N * mult) mod 2) * 180°) mod 360°."

    entries: List[StaticDegreeEntry] = []
    for v in range(start_val, end_val + 1, step):
        entries.append(calculate_static_degree(float(v), multiplier, convention, precision))

    return StaticDegreeTableResponse(
        convention=convention,
        formula_description=formula_desc,
        multiplier=multiplier,
        precision=precision,
        total_entries=len(entries),
        entries=entries
    )


def export_static_degree_csv(
    start_val: int = 1,
    end_val: int = 1000,
    multiplier: float = 1.0,
    convention: str = "gann_cardinal_axis"
) -> str:
    """Generate CSV string of the Static Degree Table."""
    table = generate_static_degree_table(start_val, end_val, 1, multiplier, convention, precision=4)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Value", "SquareRoot", "Cycle", "StaticDegree", "Quadrant", "CardinalAspect", "TrineAspect"
    ])
    for e in table.entries:
        writer.writerow([
            e.value,
            e.sqrt_value,
            e.cycle,
            e.static_degree,
            e.quadrant,
            e.cardinal_aspect or "",
            e.trine_aspect or ""
        ])
    return output.getvalue()
