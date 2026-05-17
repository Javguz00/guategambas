import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MAPPING_FILE = path.join(process.cwd(), "data", "admin-media-mapping.json");

export async function GET() {
  try {
    if (!fs.existsSync(MAPPING_FILE)) {
      return NextResponse.json({ mapping: {} });
    }

    const raw = fs.readFileSync(MAPPING_FILE, "utf-8");
    const mapping = JSON.parse(raw) as Record<string, Array<{ filename: string; grade?: string; slot?: string; title?: string }>>;
    return NextResponse.json({ mapping: mapping || {} });
  } catch {
    return NextResponse.json({ mapping: {} });
  }
}
