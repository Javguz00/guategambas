import { successResponse } from '@/lib/api-helpers';
import { logout } from '@/lib/auth';

export async function POST() {
  try {
    await logout();
    return successResponse(null, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    return successResponse(null, 'Logged out');
  }
}
