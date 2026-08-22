import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, avatarUrl } = await req.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Determine table based on role
    if (session.user.role === 'FACULTY') {
      await prisma.faculty.update({
        where: { id: session.user.id },
        data: {
          fullName: name,
          avatarUrl: avatarUrl || null,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name: name,
          avatarUrl: avatarUrl || null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
