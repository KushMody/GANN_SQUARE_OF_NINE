import { NextRequest, NextResponse } from "next/server";
import { calculateSquareRotations } from "@/lib/math/rotations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input_angle, rotation_type = "90_degree", comparison_targets, tolerance = 3.0 } = body;
    const result = calculateSquareRotations(input_angle, rotation_type, comparison_targets, tolerance);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to calculate rotations" }, { status: 400 });
  }
}
