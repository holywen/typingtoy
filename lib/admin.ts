import { auth } from './auth';

export async function isAdmin(): Promise<boolean> {
  try {
    const session = await auth();

    if (!session?.user) {
      return false;
    }

    // Role is now available directly in session
    return session.user.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function requireAdmin() {
  const admin = await isAdmin();

  if (!admin) {
    throw new Error('Unauthorized: Admin access required');
  }

  return true;
}
