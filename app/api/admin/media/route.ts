import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ensureAdminStorage } from "@/lib/admin-storage";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { withSchemaProtection } from "@/lib/middleware/with-schema-protection";

const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const allowedMimePrefixes = ["image/", "video/"];

function toMediaUrl(filename: string) {
  return `/api/media/${filename.split("/").map(encodeURIComponent).join("/")}`;
}

function mimeTypeFromFilename(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".m4v")) return "video/x-m4v";
  return "image/jpeg";
}

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

type UploadPayloadResult =
  | { ok: true; filename: string; mimeType: string; buffer: Buffer }
  | { ok: false; error: string; status: number };

function isAllowedMimeType(mimeType: string) {
  return allowedMimePrefixes.some((prefix) => mimeType.startsWith(prefix));
}

async function readUploadPayload(request: NextRequest): Promise<UploadPayloadResult> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    const filename = formData.get("filename");

    if (!(file instanceof File) || typeof filename !== "string" || !filename) {
      return { ok: false, error: "Datos invalidos", status: 400 };
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return { ok: false, error: "Archivo demasiado grande. Maximo permitido: 5MB.", status: 413 };
    }

    const mimeType = file.type || mimeTypeFromFilename(filename);
    if (!isAllowedMimeType(mimeType)) {
      return { ok: false, error: "Tipo de archivo no permitido. Solo imagenes o video.", status: 400 };
    }

    return {
      ok: true,
      filename: safeFilename(filename),
      mimeType,
      buffer: Buffer.from(await file.arrayBuffer())
    };
  }

  const body = await request.json();
  const { filename, data } = body as { filename?: unknown; data?: unknown };

  if (!filename || typeof filename !== "string" || !data || typeof data !== "string") {
    return { ok: false, error: "Datos invalidos", status: 400 };
  }

  const match = data.match(/^data:((?:image|video)\/[^;]+);base64,(.+)$/);
  const mimeType = match?.[1] || mimeTypeFromFilename(filename);
  const b64 = match ? match[2] : data;

  const buffer = Buffer.from(b64, "base64");
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Archivo demasiado grande. Maximo permitido: 5MB.", status: 413 };
  }
  if (!isAllowedMimeType(mimeType)) {
    return { ok: false, error: "Tipo de archivo no permitido. Solo imagenes o video.", status: 400 };
  }

  return {
    ok: true,
    filename: safeFilename(filename),
    mimeType,
    buffer
  };
}

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

async function handleGET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await ensureAdminStorage();
  } catch (err) {
    console.error("ensureAdminStorage failed (GET /api/admin/media)", err);
    return NextResponse.json({ error: "Fallo de esquema en la base de datos. Ejecuta las migraciones (prisma migrate deploy) o habilita permisos DDL." }, { status: 500 });
  }
  const [dbAssets, mappingRows] = await Promise.all([
    prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, select: { filename: true, mimeType: true, createdAt: true } }),
    prisma.mediaMapping.findMany({ orderBy: { updatedAt: "desc" }, select: { productId: true, filename: true, grade: true, slot: true, title: true } })
  ]);
  const legacyFiles = listImagesRecursive(PHOTOS_DIR, PHOTOS_DIR);
  const files = Array.from(new Set([...dbAssets.map((asset) => asset.filename), ...legacyFiles]));
  const assets = dbAssets.map((asset) => ({
    filename: asset.filename,
    mimeType: asset.mimeType,
    url: toMediaUrl(asset.filename),
    source: "database" as const,
    createdAt: asset.createdAt.toISOString()
  }));
  const mapping = mappingRows.reduce<Record<string, Array<{ filename: string; grade?: string; slot?: string; title?: string }>>>((acc, row) => {
    acc[row.productId] = acc[row.productId] || [];
    acc[row.productId].push({ filename: row.filename, grade: row.grade || undefined, slot: row.slot || undefined, title: row.title || undefined });
    return acc;
  }, {});
  return NextResponse.json({ files, assets, mapping });
}

async function handlePOST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await ensureAdminStorage();
  } catch (err) {
    console.error("ensureAdminStorage failed (POST /api/admin/media)", err);
    return NextResponse.json({ error: "Fallo de esquema en la base de datos. Ejecuta las migraciones (prisma migrate deploy) o habilita permisos DDL." }, { status: 500 });
  }
  const upload = await readUploadPayload(request);
  if (!upload.ok) return NextResponse.json({ error: upload.error }, { status: upload.status });
  await prisma.mediaAsset.upsert({
    where: { filename: upload.filename },
    create: { filename: upload.filename, mimeType: upload.mimeType, data: upload.buffer },
    update: { mimeType: upload.mimeType, data: upload.buffer }
  });
  return NextResponse.json({ ok: true, filename: upload.filename, url: toMediaUrl(upload.filename), mimeType: upload.mimeType });
}

export const GET = withSchemaProtection(async (request) => {
  void request;
  return handleGET();
});
export const POST = withSchemaProtection(async (request) => handlePOST(request as NextRequest));
