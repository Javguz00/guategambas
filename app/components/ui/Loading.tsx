'use client';

import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ size = 'md', message = 'Cargando...' }) => {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <div className={`${sizeStyles[size]} border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin`} />
      {message && <p className="text-gray-600">{message}</p>}
    </div>
  );
};

export default Loading;
