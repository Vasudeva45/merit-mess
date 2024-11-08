import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${session.user.sub}-${timestamp}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    });

    // Update the profile in the database with the new image URL
    await prisma.profile.update({
      where: {
        userId: session.user.sub,
      },
      data: {
        imageUrl: blob.url,
      },
    });

    return NextResponse.json({ imageUrl: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}