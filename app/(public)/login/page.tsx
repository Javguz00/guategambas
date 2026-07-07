'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Redirect to admin dashboard
      router.push('/admin/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="card shadow-card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🦐</div>
            <h1 className="text-3xl font-bold text-dark mb-1">
              GuateGambas
            </h1>
            <p className="text-gray-500">Admin Panel</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              ⚠ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              type="text"
              label="Usuario"
              placeholder="javguz00"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Iniciando sesión...' : '✓ Iniciar sesión'}
            </Button>
          </form>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              className="w-full"
              asChild
            >
              <Link href="/">Volver a inicio</Link>
            </Button>
          </div>
        </div>

        {/* Footer Message */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Solo para administradores autorizados
        </p>
      </div>
    </div>
  );
}
