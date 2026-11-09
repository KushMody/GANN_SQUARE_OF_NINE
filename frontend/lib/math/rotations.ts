import { RotationNode, RotationsResult } from "../types";

export function circularDifference(angle1: number, angle2: number): number {
  let diff = Math.abs(angle1 - angle2) % 360.0;
  if (diff > 180.0) {
    diff = 360.0 - diff;
  }
  return diff;
}

export function calculateSquareRotations(
  inputAngle: number,
  rotationType: "90_degree" | "60_degree" = "90_degree",
  comparisonTargets?: Record<string, number>,
  tolerance: number = 3.0
): RotationsResult {
  const normalizedInput = ((inputAngle % 360.0) + 360.0) % 360.0;
  let step = 90.0;
  let count = 4;

  if (rotationType === "60_degree" || (rotationType as string) === "60") {
    step = 60.0;
    count = 6;
  }

  const rotations: RotationNode[] = [];
  let anyMatch = false;

  for (let i = 1; i <= count; i++) {
    const addedDegrees = (i - 1) * step;
    const rotAngle = Number(((normalizedInput + addedDegrees) % 360.0).toFixed(2));

    let isMatched = false;
    let matchedLabel: string | null = null;
    let matchedAngle: number | null = null;
    let orb: number | null = null;

    if (comparisonTargets) {
      let bestOrb = 180.0;
      for (const [tLabel, tAngle] of Object.entries(comparisonTargets)) {
        const d = circularDifference(rotAngle, tAngle);
        if (d <= tolerance && d < bestOrb) {
          bestOrb = d;
          isMatched = true;
          matchedLabel = tLabel;
          matchedAngle = tAngle;
          orb = Number(d.toFixed(2));
        }
      }
    }

    if (isMatched) {
      anyMatch = true;
    }

    rotations.push({
      rotation_index: i,
      nominal_step_degrees: addedDegrees,
      angle: rotAngle,
      label: `Rotation ${i} (${Math.round(addedDegrees)}°)`,
      is_matched: isMatched,
      matched_target_label: matchedLabel,
      matched_target_angle: matchedAngle,
      orb
    });
  }

  return {
    input_angle: Number(normalizedInput.toFixed(2)),
    rotation_type: rotationType,
    step_increment: step,
    tolerance,
    rotations,
    has_matches: anyMatch
  };
}
