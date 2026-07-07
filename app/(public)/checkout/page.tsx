'use client';

import { useState } from 'react';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    city: '',
    department: '',
    address: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create order');
      alert('Pedido realizado exitosamente');
    } catch (error) {
      alert('Error al realizar el pedido: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Información del Cliente</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input
              label="Nombre"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
            />
            <Input
              label="Email"
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input
              label="Teléfono/WhatsApp"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleChange}
              required
            />
            <Input
              label="Ciudad"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input
              label="Departamento (Opcional)"
              name="department"
              value={formData.department}
              onChange={handleChange}
            />
            <Input
              label="Dirección (Opcional)"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas Especiales</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button size="lg" variant="primary" type="submit" isLoading={loading}>
            Confirmar Pedido
          </Button>
        </form>
      </div>

      <div>
        <div className="bg-white p-6 rounded-lg shadow sticky top-20">
          <h2 className="text-xl font-semibold mb-4">Resumen</h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Q0.00</span>
            </div>
            <div className="flex justify-between">
              <span>Envío:</span>
              <span>Q0.00</span>
            </div>
          </div>
          <div className="border-t pt-4 flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span>Q0.00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
