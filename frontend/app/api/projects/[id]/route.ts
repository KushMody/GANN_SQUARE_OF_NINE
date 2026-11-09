import { NextRequest, NextResponse } from "next/server";
import { deleteProject } from "@/lib/math/projects_store";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  const success = deleteProject(numId);
  if (success) {
    return NextResponse.json({ message: "Project deleted successfully" });
  } else {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
}
