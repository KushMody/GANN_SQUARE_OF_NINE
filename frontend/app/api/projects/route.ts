import { NextRequest, NextResponse } from "next/server";
import { listProjects, saveProject } from "@/lib/math/projects_store";

export async function GET() {
  return NextResponse.json(listProjects());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const proj = saveProject(body);
    return NextResponse.json(proj);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save project" }, { status: 400 });
  }
}
