import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ensureAdminStorage } from "@/lib/admin-storage";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");

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

async function readUploadPayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    const filename = formData.get("filename");

    if (!(file instanceof File) || typeof filename !== "string" || !filename) {
      return null;
    }

    return {
      filename: safeFilename(filename),
      mimeType: file.type || mimeTypeFromFilename(filename),
      buffer: Buffer.from(await file.arrayBuffer())
    };
  }

  const body = await request.json();
  const { filename, data } = body as { filename?: unknown; data?: unknown };

  if (!filename || typeof filename !== "string" || !data || typeof data !== "string") {
    return null;
  }

  const match = data.match(/^data:((?:image|video)\/[^;]+);base64,(.+)$/);
  const mimeType = match?.[1] || mimeTypeFromFilename(filename);
  const b64 = match ? match[2] : data;

  return {
    filename: safeFilename(filename),
    mimeType,
    buffer: Buffer.from(b64, "base64")
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

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await ensureAdminStorage();
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

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await ensureAdminStorage();
  const upload = await readUploadPayload(request);
  if (!upload) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  await prisma.mediaAsset.upsert({
    where: { filename: upload.filename },
    create: { filename: upload.filename, mimeType: upload.mimeType, data: upload.buffer },
    update: { mimeType: upload.mimeType, data: upload.buffer }
  });
  return NextResponse.json({ ok: true, filename: upload.filename, url: toMediaUrl(upload.filename), mimeType: upload.mimeType });
}
