import { NextRequest, NextResponse } from "next/server";
import { calculatePriceTimeSquaring } from "@/lib/math/price_time_squaring";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = calculatePriceTimeSquaring(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to calculate squaring" }, { status: 400 });
  }
}
