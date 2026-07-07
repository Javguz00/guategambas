import { NextRequest, NextResponse } from 'next/server';
import { access } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';
import { errorResponse } from '@/lib/api-helpers';

interface RouteContext {
  params: Promise<{
    filename: string;
  }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { filename } = await context.params;
    const decoded = decodeURIComponent(filename);

    const asset = await prisma.mediaAsset.findUnique({
      where: { filename: decoded },
    });

    if (!asset) {
      const fallbackPath = path.join(process.cwd(), 'public', 'uploads', decoded);
      try {
        await access(fallbackPath);
        return NextResponse.redirect(new URL(`/uploads/${encodeURIComponent(decoded)}`, _request.url));
      } catch {
        return NextResponse.redirect(new URL('/placeholder-product.svg', _request.url));
      }
    }

    return new NextResponse(Buffer.from(asset.data), {
      status: 200,
      headers: {
        'Content-Type': asset.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Media file error:', error);
    const { filename } = await context.params;
    const decoded = decodeURIComponent(filename);
    const fallbackPath = path.join(process.cwd(), 'public', 'uploads', decoded);
    try {
      await access(fallbackPath);
      return NextResponse.redirect(new URL(`/uploads/${encodeURIComponent(decoded)}`, _request.url));
    } catch {}
    return errorResponse('No se pudo cargar el archivo', 500);
  }
}
