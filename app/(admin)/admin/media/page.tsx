'use client';

import { useEffect, useState } from 'react';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Loading from '@/app/components/ui/Loading';
import type { ApiResponse } from '@/lib/types';

interface HeroMediaItem {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  title?: string | null;
  slot?: string | null;
}

export default function AdminMediaPage() {
  const [items, setItems] = useState<HeroMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slot, setSlot] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/media/hero', { cache: 'no-store' });
      const result: ApiResponse<HeroMediaItem[]> = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo cargar multimedia');
      }
      setItems(result.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar multimedia');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError('Selecciona un archivo para subir.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('scope', 'hero');
      formData.append('title', title);
      formData.append('slot', slot);

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const result: ApiResponse<{ filename: string }> = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo subir el archivo');
      }

      setFile(null);
      setTitle('');
      setSlot('');
      await fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el archivo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este elemento multimedia del hero?')) {
      return;
    }

    try {
      const response = await fetch(`/api/media/hero?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const result: ApiResponse = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo eliminar');
      }
      await fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Multimedia</h1>
        <p className="text-sm text-gray-500">
          Sube imágenes o videos para el hero de la página principal y ordénalos por slot.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleUpload} className="rounded-lg bg-white p-6 shadow space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Título (opcional)"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Nuevas caridinas importadas"
          />
          <Input
            label="Slot (opcional)"
            value={slot}
            onChange={(event) => setSlot(event.target.value)}
            placeholder="hero-01"
            helperText="Se ordena alfabéticamente."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Archivo</label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <p className="mt-1 text-sm text-gray-500">Máximo 10MB. Formatos imagen/video.</p>
        </div>

        <Button type="submit" isLoading={saving}>
          Subir al hero
        </Button>
      </form>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold mb-4">Elementos del hero</h2>

        {loading ? (
          <Loading />
        ) : items.length === 0 ? (
          <p className="text-gray-500">No hay elementos cargados.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-200 p-4 space-y-3">
                <div className="h-44 overflow-hidden rounded bg-gray-100">
                  {item.mimeType.startsWith('video/') ? (
                    <video src={item.url} className="h-full w-full object-cover" controls />
                  ) : (
                    <img src={item.url} alt={item.title || item.filename} className="h-full w-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{item.title || 'Sin título'}</p>
                  <p className="text-xs text-gray-500">{item.slot || 'sin-slot'} · {item.filename}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => handleDelete(item.id)}>
                  Eliminar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

