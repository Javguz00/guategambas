import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const MAPPING_FILE = path.join(process.cwd(), "data", "admin-media-mapping.json");

function ensureDataFile() {
  const dir = path.dirname(MAPPING_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(MAPPING_FILE)) fs.writeFileSync(MAPPING_FILE, JSON.stringify({}), "utf-8");
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  ensureDataFile();
  const mappingRaw = fs.readFileSync(MAPPING_FILE, "utf-8");
  let mapping = {} as Record<string, Array<{ filename: string; grade?: string }>>;
  try { mapping = JSON.parse(mappingRaw); } catch { mapping = {}; }
  return NextResponse.json({ mapping });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json();
  const { productId, filename, grade, slot, title } = body as { productId?: unknown; filename?: unknown; grade?: unknown; slot?: unknown; title?: unknown };
  if (!productId || typeof productId !== "string" || !filename || typeof filename !== "string") return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  ensureDataFile();
  const raw = fs.readFileSync(MAPPING_FILE, "utf-8");
  let mapping = {} as Record<string, Array<{ filename: string; grade?: string; slot?: string; title?: string }>>;
  try { mapping = JSON.parse(raw); } catch { mapping = {}; }
  mapping[productId] = mapping[productId] || [];
  const normalizedSlot = typeof slot === "string" ? slot : undefined;
  mapping[productId] = mapping[productId].filter((entry) => {
    if (normalizedSlot) return entry.slot !== normalizedSlot;
    return entry.filename !== filename;
  });
  mapping[productId].push({
    filename,
    grade: typeof grade === "string" ? grade : undefined,
    slot: normalizedSlot,
    title: typeof title === "string" ? title : undefined
  });
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2), "utf-8");
  return NextResponse.json({ ok: true, mapping: mapping[productId] });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json();
  const { productId, filename } = body as { productId?: unknown; filename?: unknown };
  if (!productId || typeof productId !== "string" || !filename || typeof filename !== "string") return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  ensureDataFile();
  const raw = fs.readFileSync(MAPPING_FILE, "utf-8");
  let mapping = {} as Record<string, Array<{ filename: string; grade?: string; slot?: string; title?: string }>>;
  try { mapping = JSON.parse(raw); } catch { mapping = {}; }
  mapping[productId] = (mapping[productId] || []).filter((m) => m.filename !== filename);
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2), "utf-8");
  return NextResponse.json({ ok: true });
}
