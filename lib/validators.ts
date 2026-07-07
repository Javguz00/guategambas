// Validadores simples para datos de entrada

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Validar número de teléfono Guatemala (7-8 dígitos)
  const phoneRegex = /^(\+502)?[\s-]?(\d{4}|\d{8})[\s-]?(\d{4})?$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateProductInput = (data: any) => {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres');
  }

  if (!data.slug || data.slug.trim().length === 0) {
    errors.push('El slug es requerido');
  }

  if (typeof data.price !== 'number' || data.price < 0) {
    errors.push('El precio debe ser un número positivo');
  }

  if (typeof data.stock !== 'number' || data.stock < 0) {
    errors.push('El stock debe ser un número positivo');
  }

  if (!data.categoryId || data.categoryId.trim().length === 0) {
    errors.push('La categoría es requerida');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateCategoryInput = (data: any) => {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }

  if (!data.slug || data.slug.trim().length === 0) {
    errors.push('El slug es requerido');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateOrderInput = (data: any) => {
  const errors: string[] = [];

  if (!data.customerName || data.customerName.trim().length < 2) {
    errors.push('El nombre del cliente es requerido');
  }

  if (!data.customerEmail || !validateEmail(data.customerEmail)) {
    errors.push('Email inválido');
  }

  if (!data.customerPhone || !validatePhone(data.customerPhone)) {
    errors.push('Teléfono inválido');
  }

  if (!data.city || data.city.trim().length === 0) {
    errors.push('La ciudad es requerida');
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('La orden debe tener al menos un item');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
