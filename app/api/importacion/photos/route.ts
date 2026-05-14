import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dir = path.resolve(process.cwd(), "public/photos/importacion-plantas");
    if (!fs.existsSync(dir)) return NextResponse.json({ photos: [] });
    const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
    const photos = files.map((f) => `/photos/importacion-plantas/${f}`);
    return NextResponse.json({ photos });
  } catch (err) {
    return NextResponse.json({ photos: [] });
  }
}
