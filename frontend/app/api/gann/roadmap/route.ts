import { NextRequest, NextResponse } from "next/server";
import { generateRoadmapGrid } from "@/lib/math/square_of_nine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = generateRoadmapGrid(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to calculate roadmap grid" }, { status: 400 });
  }
}
