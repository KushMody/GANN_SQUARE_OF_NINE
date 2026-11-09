import { NextResponse } from "next/server";
import { SUPPORTED_SYMBOLS } from "@/lib/math/market_data";

export async function GET() {
  return NextResponse.json(SUPPORTED_SYMBOLS);
}
