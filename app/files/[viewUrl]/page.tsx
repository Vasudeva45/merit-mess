import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function FilePage({ params }: { params: { viewUrl: string } }) {
  const file = await prisma.projectFile.findUnique({
    where: {
      viewUrl: params.viewUrl
    }
  });

  if (!file) {
    redirect('/404');
  }

  // Redirect to the actual file URL
  redirect(file.url);
}