import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';

export async function GET() {
  try {
    const admin = await isAdmin();

    return NextResponse.json({ isAdmin: admin }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }
}
