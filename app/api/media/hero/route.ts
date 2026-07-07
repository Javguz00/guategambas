import { NextRequest } from 'next/server';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';
import { createdResponse, errorResponse, successResponse } from '@/lib/api-helpers';
import { isAdmin } from '@/lib/auth';

interface HeroMediaItem {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  title: string | null;
  slot: string | null;
}

const isDatabaseUnavailableError = (error: unknown) =>
  error instanceof Error &&
  (error.message.includes("Can't reach database server") ||
    error.message.includes('PrismaClientInitializationError'));

const HERO_FALLBACK_FILE = path.join(process.cwd(), 'public', 'uploads', 'hero-media.json');

export async function GET() {
  try {
    const mappings = await prisma.mediaMapping.findMany({
      where: {
        productId: '__hero__',
      },
      orderBy: [{ slot: 'asc' }, { createdAt: 'asc' }],
    });

    if (mappings.length === 0) {
      return successResponse([] as HeroMediaItem[]);
    }

    const filenames = mappings.map((item) => item.filename);
    const assets = await prisma.mediaAsset.findMany({
      where: {
        filename: { in: filenames },
      },
    });

    const assetByFilename = new Map(assets.map((asset) => [asset.filename, asset]));

    const items: HeroMediaItem[] = mappings
      .map((mapping) => {
        const asset = assetByFilename.get(mapping.filename);
        if (!asset) {
          return null;
        }

        return {
          id: mapping.id,
          filename: mapping.filename,
          url: `/api/media/file/${encodeURIComponent(mapping.filename)}`,
          mimeType: asset.mimeType,
          title: mapping.title,
          slot: mapping.slot,
        };
      })
      .filter((item): item is HeroMediaItem => item !== null);

    return successResponse(items);
  } catch (error) {
    console.error('Hero media fetch error:', error);
    if (isDatabaseUnavailableError(error)) {
      try {
        const json = await readFile(HERO_FALLBACK_FILE, 'utf-8');
        const fallbackItems = JSON.parse(json) as HeroMediaItem[];
        return successResponse(fallbackItems);
      } catch {
        return successResponse([] as HeroMediaItem[]);
      }
    }
    return errorResponse('No se pudo cargar el hero multimedia', 500);
  }
}

export async function POST(request: NextRequest) {
  let id = '';
  let title: string | null = null;
  let slot: string | null = null;

  try {
    const admin = await isAdmin();
    if (!admin) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    id = typeof body.id === 'string' ? body.id : '';
    title = typeof body.title === 'string' ? body.title : null;
    slot = typeof body.slot === 'string' ? body.slot : null;

    if (!id) {
      return errorResponse('ID requerido', 400);
    }

    const updated = await prisma.mediaMapping.update({
      where: { id },
      data: {
        title,
        slot,
      },
    });

    return createdResponse(updated, 'Hero multimedia actualizado');
  } catch (error) {
    console.error('Hero media update error:', error);
    if (isDatabaseUnavailableError(error)) {
      try {
        const json = await readFile(HERO_FALLBACK_FILE, 'utf-8');
        const items = JSON.parse(json) as HeroMediaItem[];
        const nextItems = items.map((item) =>
          item.id === id
            ? {
                ...item,
                title: title ?? item.title,
                slot: slot ?? item.slot,
              }
            : item
        );
        await writeFile(HERO_FALLBACK_FILE, JSON.stringify(nextItems, null, 2), 'utf-8');
        return createdResponse({ ok: true }, 'Hero multimedia actualizado');
      } catch {
        return errorResponse('No se pudo actualizar el hero multimedia', 500);
      }
    }
    return errorResponse('No se pudo actualizar el hero multimedia', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');

  try {
    const admin = await isAdmin();
    if (!admin) {
      return errorResponse('Unauthorized', 401);
    }

    if (!id) {
      return errorResponse('ID requerido', 400);
    }

    await prisma.mediaMapping.delete({
      where: { id },
    });

    return successResponse({ ok: true }, 'Elemento eliminado');
  } catch (error) {
    console.error('Hero media delete error:', error);
    if (isDatabaseUnavailableError(error)) {
      try {
        await mkdir(path.dirname(HERO_FALLBACK_FILE), { recursive: true });
        const json = await readFile(HERO_FALLBACK_FILE, 'utf-8');
        const items = JSON.parse(json) as HeroMediaItem[];
        const nextItems = items.filter((item) => item.id !== id);
        await writeFile(HERO_FALLBACK_FILE, JSON.stringify(nextItems, null, 2), 'utf-8');
        return successResponse({ ok: true }, 'Elemento eliminado');
      } catch {
        return errorResponse('No se pudo eliminar el elemento', 500);
      }
    }
    return errorResponse('No se pudo eliminar el elemento', 500);
  }
}
