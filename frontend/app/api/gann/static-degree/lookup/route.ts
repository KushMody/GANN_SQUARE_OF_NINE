import { NextRequest, NextResponse } from "next/server";
import { calculateStaticDegree } from "@/lib/math/static_degree";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const val = parseFloat(searchParams.get("value") || "100");
  const multiplier = parseFloat(searchParams.get("multiplier") || "1.0");
  const convention = searchParams.get("convention") || "gann_cardinal_axis";

  try {
    const entry = calculateStaticDegree(val, multiplier, convention, 4);
    return NextResponse.json(entry);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to lookup static degree" }, { status: 400 });
  }
}
