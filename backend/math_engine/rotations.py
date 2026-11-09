"""Square Rotations Tool Engine.

Computes 90-degree and 60-degree rotations on the Gann wheel,
normalizes values to 0-360°, and detects matches against price and time angles
within a configurable tolerance.
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class RotationNode(BaseModel):
    """A single rotation step."""
    rotation_index: int = Field(..., description="1-based rotation index")
    nominal_step_degrees: float = Field(..., description="Cumulative degrees added, e.g. 0, 90, 180, 270")
    angle: float = Field(..., description="Calculated angle normalized to 0-360°")
    label: str = Field(..., description="Display label, e.g. 'Rotation 1 (0°)'")
    is_matched: bool = Field(False, description="True if a comparison angle falls within tolerance")
    matched_target_label: Optional[str] = Field(None, description="Label of matched angle (e.g. 'Trading Days Angle')")
    matched_target_angle: Optional[float] = Field(None, description="Value of matched angle")
    orb: Optional[float] = Field(None, description="Angular difference from matched target")


class RotationsResult(BaseModel):
    """Complete rotations analysis."""
    input_angle: float = Field(..., description="Input base angle (0-360°)")
    rotation_type: str = Field("90_degree", description="'90_degree' or '60_degree'")
    step_increment: float = Field(90.0, description="Step size in degrees")
    tolerance: float = Field(3.0, description="Matching tolerance in degrees")
    rotations: List[RotationNode] = Field(default_factory=list)
    has_matches: bool = Field(False, description="Whether any comparison targets matched a rotation")


def circular_difference(angle1: float, angle2: float) -> float:
    """Calculate the shortest circular distance between two angles (0 to 180°)."""
    diff = abs(angle1 - angle2) % 360.0
    if diff > 180.0:
        diff = 360.0 - diff
    return diff


def calculate_square_rotations(
    input_angle: float,
    rotation_type: str = "90_degree",
    comparison_targets: Optional[Dict[str, float]] = None,
    tolerance: float = 3.0
) -> RotationsResult:
    """Calculate 90° or 60° rotations for an input angle.
    
    Parameters:
        input_angle: Starting angle (0-360°).
        rotation_type: '90_degree' (4 rotations) or '60_degree' (6 rotations).
        comparison_targets: Optional dict of {'Price Range': 193.4, 'Trading Days': 15.2}.
        tolerance: Matching threshold in degrees (e.g. ±3.0°).
    """
    normalized_input = input_angle % 360.0

    if rotation_type == "60_degree" or rotation_type == "60":
        step = 60.0
        num_rotations = 6
        step_type = "60_degree"
    else:
        step = 90.0
        num_rotations = 4
        step_type = "90_degree"

    rotations: List[RotationNode] = []
    has_matches = False

    for i in range(num_rotations):
        nominal_step = i * step
        rot_angle = (normalized_input + nominal_step) % 360.0

        # Check against comparison targets
        is_matched = False
        matched_label = None
        matched_val = None
        min_orb = None

        if comparison_targets:
            for label, target_deg in comparison_targets.items():
                target_norm = target_deg % 360.0
                orb = circular_difference(rot_angle, target_norm)
                if orb <= tolerance:
                    if min_orb is None or orb < min_orb:
                        min_orb = orb
                        is_matched = True
                        matched_label = label
                        matched_val = target_norm
                        has_matches = True

        rotations.append(RotationNode(
            rotation_index=i + 1,
            nominal_step_degrees=nominal_step,
            angle=round(rot_angle, 2),
            label=f"Rotation {i + 1} (+{int(nominal_step)}°)",
            is_matched=is_matched,
            matched_target_label=matched_label,
            matched_target_angle=round(matched_val, 2) if matched_val is not None else None,
            orb=round(min_orb, 2) if min_orb is not None else None
        ))

    return RotationsResult(
        input_angle=round(normalized_input, 2),
        rotation_type=step_type,
        step_increment=step,
        tolerance=tolerance,
        rotations=rotations,
        has_matches=has_matches
    )
