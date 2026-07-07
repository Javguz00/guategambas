import { NextRequest } from 'next/server';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';
import { createdResponse, errorResponse } from '@/lib/api-helpers';
import { isAdmin } from '@/lib/auth';

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

const toSafeFilename = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const isDatabaseUnavailableError = (error: unknown) =>
  error instanceof Error &&
  (error.message.includes("Can't reach database server") ||
    error.message.includes('PrismaClientInitializationError'));

const HERO_FALLBACK_FILE = path.join(process.cwd(), 'public', 'uploads', 'hero-media.json');

export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return errorResponse('Unauthorized', 401);
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const scope = String(formData.get('scope') || 'product');
    const productId = String(formData.get('productId') || '').trim();
    const title = String(formData.get('title') || '').trim() || null;
    const slot = String(formData.get('slot') || '').trim() || null;

    if (!(file instanceof File)) {
      return errorResponse('Archivo requerido', 400);
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return errorResponse('Solo se permiten imagenes o videos', 400);
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return errorResponse('El archivo excede 10MB', 400);
    }

    const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
    const baseName = toSafeFilename(file.name.replace(/\.[^/.]+$/, '')) || 'archivo';
    const filename = `${Date.now()}-${baseName}${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    try {
      await prisma.mediaAsset.create({
        data: {
          filename,
          mimeType: file.type,
          data: bytes,
        },
      });

      if (scope === 'hero') {
        await prisma.mediaMapping.create({
          data: {
            productId: '__hero__',
            filename,
            title,
            slot: slot || `hero-${Date.now()}`,
          },
        });
      } else if (productId) {
        await prisma.mediaMapping.create({
          data: {
            productId,
            filename,
            title,
            slot: slot || 'main',
          },
        });
      }

      return createdResponse(
        {
          filename,
          mimeType: file.type,
          url: `/api/media/file/${encodeURIComponent(filename)}`,
        },
        'Archivo subido correctamente'
      );
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error;
      }

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadsDir, { recursive: true });
      await writeFile(path.join(uploadsDir, filename), bytes);

      if (scope === 'hero') {
        let currentItems: Array<{
          id: string;
          filename: string;
          url: string;
          mimeType: string;
          title?: string | null;
          slot?: string | null;
        }> = [];

        try {
          const json = await readFile(HERO_FALLBACK_FILE, 'utf-8');
          currentItems = JSON.parse(json);
        } catch {}

        currentItems.push({
          id: `hero-${Date.now()}`,
          filename,
          url: `/uploads/${filename}`,
          mimeType: file.type,
          title,
          slot: slot || `hero-${Date.now()}`,
        });

        await writeFile(HERO_FALLBACK_FILE, JSON.stringify(currentItems, null, 2), 'utf-8');
      }

      return createdResponse(
        {
          filename,
          mimeType: file.type,
          url: `/uploads/${filename}`,
        },
        'Archivo subido correctamente (modo local)'
      );
    }
  } catch (error) {
    console.error('Media upload error:', error);
    return errorResponse('No se pudo subir el archivo', 500);
  }
}
