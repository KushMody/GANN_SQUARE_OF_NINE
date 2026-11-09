import { NextRequest, NextResponse } from "next/server";
import { projectFutureAlignments } from "@/lib/math/look_ahead";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = projectFutureAlignments(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to project look-ahead" }, { status: 400 });
  }
}
