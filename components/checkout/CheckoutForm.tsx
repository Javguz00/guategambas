'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  paymentMethod: 'credit-card' | 'debit-card' | 'cash' | 'transfer';
}

interface CheckoutFormProps {
  onSubmit?: (data: CheckoutFormData) => void;
  loading?: boolean;
}

export default function CheckoutForm({ onSubmit, loading }: CheckoutFormProps) {
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: 'credit-card',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) newErrors.firstName = 'Nombre requerido';
    if (!formData.lastName) newErrors.lastName = 'Apellido requerido';
    if (!formData.email) newErrors.email = 'Email requerido';
    if (!formData.phone) newErrors.phone = 'Teléfono requerido';
    if (!formData.address) newErrors.address = 'Dirección requerida';
    if (!formData.city) newErrors.city = 'Ciudad requerida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit?.(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <h2 className="text-2xl font-bold">Información de envío</h2>

      {/* Personal Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          error={errors.firstName}
          placeholder="Juan"
          required
        />
        <Input
          label="Apellido"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          error={errors.lastName}
          placeholder="Pérez"
          required
        />
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="juan@example.com"
          required
        />
        <Input
          label="Teléfono"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          placeholder="+502 1234-5678"
          required
        />
      </div>

      {/* Address */}
      <Input
        label="Dirección"
        name="address"
        value={formData.address}
        onChange={handleChange}
        error={errors.address}
        placeholder="Calle Principal 123"
        required
      />

      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Ciudad"
          name="city"
          value={formData.city}
          onChange={handleChange}
          error={errors.city}
          placeholder="Guatemala"
          required
        />
        <Input
          label="Departamento"
          name="state"
          value={formData.state}
          onChange={handleChange}
          placeholder="Guatemala"
        />
        <Input
          label="Código Postal"
          name="zipCode"
          value={formData.zipCode}
          onChange={handleChange}
          placeholder="01001"
        />
      </div>

      {/* Payment Method */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="font-semibold mb-4">Método de pago</h3>
        <div className="space-y-3">
          <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="radio"
              name="paymentMethod"
              value="credit-card"
              checked={formData.paymentMethod === 'credit-card'}
              onChange={handleChange}
              className="w-4 h-4 text-primary"
            />
            <span className="ml-3 font-medium">💳 Tarjeta de Crédito</span>
          </label>

          <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="radio"
              name="paymentMethod"
              value="debit-card"
              checked={formData.paymentMethod === 'debit-card'}
              onChange={handleChange}
              className="w-4 h-4 text-primary"
            />
            <span className="ml-3 font-medium">💳 Tarjeta de Débito</span>
          </label>

          <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={formData.paymentMethod === 'cash'}
              onChange={handleChange}
              className="w-4 h-4 text-primary"
            />
            <span className="ml-3 font-medium">💰 Pago en efectivo</span>
          </label>

          <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="radio"
              name="paymentMethod"
              value="transfer"
              checked={formData.paymentMethod === 'transfer'}
              onChange={handleChange}
              className="w-4 h-4 text-primary"
            />
            <span className="ml-3 font-medium">🏦 Transferencia bancaria</span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        isLoading={loading}
      >
        Completar compra
      </Button>
    </form>
  );
}
