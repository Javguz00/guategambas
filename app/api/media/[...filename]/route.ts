import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ensureAdminStorage } from "@/lib/admin-storage";
import { prisma } from "@/lib/prisma";

const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");

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

function toSafePath(filename: string) {
  const resolved = path.resolve(PHOTOS_DIR, filename);
  if (!resolved.startsWith(PHOTOS_DIR)) return null;
  return resolved;
}

export async function GET(_request: Request, context: { params: Promise<{ filename: string[] }> }) {
  try {
    await ensureAdminStorage();
  } catch (err) {
    console.error("ensureAdminStorage failed (GET /api/media/[...filename])", err);
    return NextResponse.json({ error: "Fallo de esquema en la base de datos. Ejecuta las migraciones (prisma migrate deploy) o habilita permisos DDL." }, { status: 500 });
  }
  const { filename } = await context.params;
  const relativeName = decodeURIComponent(filename.join("/"));

  const dbAsset = await prisma.mediaAsset.findUnique({ where: { filename: relativeName } });
  if (dbAsset) {
    return new NextResponse(Buffer.from(dbAsset.data), {
      status: 200,
      headers: {
        "Content-Type": dbAsset.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  }

  const safePath = toSafePath(relativeName);
  if (!safePath || !fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(safePath);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": mimeTypeFromFilename(relativeName),
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}