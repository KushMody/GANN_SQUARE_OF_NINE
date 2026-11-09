import { NextRequest, NextResponse } from "next/server";
import { runGannBacktest } from "@/lib/math/backtest";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = runGannBacktest(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to execute backtest" }, { status: 400 });
  }
}
