import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
      const session = await getSession();
      const user = session?.user;
  
      if (!user?.sub) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const { groupId, memberId, status } = await request.json();
  
      // Verify that the user owns this invitation
      const member = await prisma.groupMember.findFirst({
        where: {
          id: memberId,
          userId: user.sub,
          groupId: groupId,
        },
      });
  
      if (!member) {
        return NextResponse.json(
          { error: 'Invitation not found or unauthorized' },
          { status: 404 }
        );
      }
  
      // Update the invitation status
      const updatedMember = await prisma.groupMember.update({
        where: {
          id: memberId,
        },
        data: {
          status: status,
        },
      });
  
      return NextResponse.json(updatedMember);
    } catch (error) {
      console.error('Failed to update invitation:', error);
      return NextResponse.json(
        { error: 'Failed to update invitation' },
        { status: 500 }
      );
    }
  }