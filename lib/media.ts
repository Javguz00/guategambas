const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v', '.ogg'];

export function isVideoMediaUrl(url?: string | null): boolean {
  if (!url) {
    return false;
  }

  const normalized = url.toLowerCase().split('?')[0];
  return VIDEO_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}

