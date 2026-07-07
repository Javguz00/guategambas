import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/api-helpers';
import { logout } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await logout();
    return successResponse(null, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    return successResponse(null, 'Logged out');
  }
}
