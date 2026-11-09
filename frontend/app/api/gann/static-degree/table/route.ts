import { NextRequest, NextResponse } from "next/server";
import { generateStaticDegreeTable } from "@/lib/math/static_degree";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = parseFloat(searchParams.get("start") || "1");
  const end = parseFloat(searchParams.get("end") || "1000");
  const multiplier = parseFloat(searchParams.get("multiplier") || "1.0");
  const convention = searchParams.get("convention") || "gann_cardinal_axis";
  const precision = parseInt(searchParams.get("precision") || "2", 10);

  try {
    const result = generateStaticDegreeTable(start, end, multiplier, convention, precision);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate static degree table" }, { status: 400 });
  }
}
