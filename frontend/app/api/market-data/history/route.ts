import { NextRequest, NextResponse } from "next/server";
import { fetchHistoricalCandles } from "@/lib/math/market_data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "SP500_2007";
  const timeframe = searchParams.get("timeframe") || "1D";

  try {
    const data = await fetchHistoricalCandles(symbol, timeframe);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch market data" }, { status: 500 });
  }
}
