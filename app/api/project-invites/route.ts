import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invites = await prisma.groupMember.findMany({
      where: {
        userId: user.sub,
        status: 'pending',
        NOT: {
          role: 'owner',
        },
      },
      include: {
        group: {
          include: {
            form: {
              select: {
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error('Failed to fetch invites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invites' },
      { status: 500 }
    );
  }
}