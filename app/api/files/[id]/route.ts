import { NextResponse } from "next/server";
import { getDb, PrintFile } from "@/lib/db";
import { getFilePath } from "@/lib/storage";
import fs from "fs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const fileRecord = db
      .prepare("SELECT * FROM print_files WHERE id = ?")
      .get(id) as PrintFile | undefined;

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fullPath = getFilePath(fileRecord.file_path);
    if (!fullPath || !fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: "File data not found on disk" },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(fullPath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": fileRecord.file_type || "application/octet-stream",
        "Content-Length": fileBuffer.length.toString(),
        "Content-Disposition": `inline; filename="${encodeURIComponent(fileRecord.file_name)}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("File serve error:", error);
    return NextResponse.json(
      { error: "Failed to read document." },
      { status: 500 }
    );
  }
}
