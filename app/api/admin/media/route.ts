import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");
const MAPPING_FILE = path.join(process.cwd(), "data", "admin-media-mapping.json");

function listImagesRecursive(dir: string, baseDir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath).split(path.sep).join("/");
    if (entry.isDirectory()) {
      return listImagesRecursive(fullPath, baseDir);
    }
    if (/\.(jpe?g|png|webp|gif|avif|mp4|webm|mov|m4v)$/i.test(entry.name)) {
      return [relativePath];
    }
    return [];
  });
}

function ensureDataFile() {
  const dir = path.dirname(MAPPING_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(MAPPING_FILE)) fs.writeFileSync(MAPPING_FILE, JSON.stringify({}), "utf-8");
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  ensureDataFile();
  const files = listImagesRecursive(PHOTOS_DIR, PHOTOS_DIR);
  const mappingRaw = fs.readFileSync(MAPPING_FILE, "utf-8");
  let mapping = {} as Record<string, Array<{ filename: string; grade?: string }>>;
  try { mapping = JSON.parse(mappingRaw); } catch { mapping = {}; }
  return NextResponse.json({ files, mapping });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json();
  const { filename, data } = body as { filename?: unknown; data?: unknown };
  if (!filename || typeof filename !== "string" || !data || typeof data !== "string") return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  // data should be a data URL like 'data:image/jpeg;base64,...' or 'data:video/mp4;base64,...'
  const match = data.match(/^data:((?:image|video)\/[^;]+);base64,(.+)$/);
  let b64 = data;
  if (match) {
    b64 = match[2];
  }
  const buffer = Buffer.from(b64, "base64");
  if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const outPath = path.join(PHOTOS_DIR, safeName);
  fs.writeFileSync(outPath, buffer);
  return NextResponse.json({ ok: true, filename: safeName, url: `/photos/${safeName}` });
}
