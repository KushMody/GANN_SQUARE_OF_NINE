import { NextRequest, NextResponse } from "next/server";
import { detectSwingsZigzag, detectSwingsAtr } from "@/lib/math/swing_detection";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candles, method = "zigzag", min_pct_deviation = 3.0, left_bars = 5, right_bars = 5, atr_period = 14, atr_multiplier = 2.5 } = body;

    let result;
    if (method === "atr") {
      result = detectSwingsAtr(candles || [], atr_period, atr_multiplier);
    } else {
      result = detectSwingsZigzag(candles || [], min_pct_deviation, left_bars, right_bars);
    }
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to detect swings" }, { status: 400 });
  }
}
