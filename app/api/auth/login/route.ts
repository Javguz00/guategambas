import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { login } from '@/lib/auth';
import { validateEmail } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    if (!validateEmail(email)) {
      return errorResponse('Invalid email format', 400);
    }

    const session = await login(email, password);

    if (!session) {
      return errorResponse('Invalid email or password', 401);
    }

    // Return session data (excluding password)
    return successResponse(
      {
        userId: session.userId,
        email: session.email,
        role: session.role,
        name: session.name,
      },
      'Login successful'
    );
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Error during login', 500);
  }
}
