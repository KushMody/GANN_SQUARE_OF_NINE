import { NextRequest } from "next/server";
import { generateStaticDegreeTable } from "@/lib/math/static_degree";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = parseFloat(searchParams.get("start") || "1");
  const end = parseFloat(searchParams.get("end") || "500");
  const multiplier = parseFloat(searchParams.get("multiplier") || "1.0");
  const convention = searchParams.get("convention") || "gann_cardinal_axis";

  const table = generateStaticDegreeTable(start, end, multiplier, convention, 2);
  const headers = "value,sqrt_value,cycle,static_degree,quadrant,cardinal_aspect,trine_aspect\n";
  const rows = table.entries
    .map(
      (e) =>
        `${e.value},${e.sqrt_value},${e.cycle},${e.static_degree},${e.quadrant},"${e.cardinal_aspect || ""}","${e.trine_aspect || ""}"`
    )
    .join("\n");

  return new Response(headers + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="gann_static_degrees.csv"'
    }
  });
}
