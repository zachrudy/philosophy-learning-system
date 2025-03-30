// src/app/api/reflections/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db/prisma';
import { reflectionsToMarkdown } from '@/lib/transforms/reflectionTransforms';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const lectureId = searchParams.get('lectureId');

    // Validate parameters
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check permissions - users can only export their own reflections unless admin/instructor
    if (userId !== session.user.id && session.user.role !== 'ADMIN' && session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'You can only export your own reflections' },
        { status: 403 }
      );
    }

    // Construct query based on parameters
    const whereClause: any = { userId };
    if (lectureId) {
      whereClause.lectureId = lectureId;

      // Get lecture details for the markdown title
      const lecture = await prisma.lecture.findUnique({
        where: { id: lectureId },
        select: { title: true, description: true }
      });

      if (!lecture) {
        return NextResponse.json(
          { error: 'Lecture not found' },
          { status: 404 }
        );
      }

      // Get reflections for the specified lecture
      const reflections = await prisma.reflection.findMany({
        where: whereClause,
        orderBy: { createdAt: 'asc' },
      });

      if (reflections.length === 0) {
        return NextResponse.json(
          { error: 'No reflections found' },
          { status: 404 }
        );
      }

      // Generate markdown
      const markdown = reflectionsToMarkdown(reflections, lecture);

      // Generate a filename
      const filename = `${lecture.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_reflections.md`;

      // Return the markdown with appropriate headers for download
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      // Get all reflections for the user
      const reflections = await prisma.reflection.findMany({
        where: whereClause,
        orderBy: { createdAt: 'asc' },
        include: {
          lecture: {
            select: { title: true, description: true }
          }
        }
      });

      if (reflections.length === 0) {
        return NextResponse.json(
          { error: 'No reflections found' },
          { status: 404 }
        );
      }

      // Group reflections by lecture
      const reflectionsByLecture = reflections.reduce((acc, reflection) => {
        const lectureId = reflection.lectureId;
        if (!acc[lectureId]) {
          acc[lectureId] = [];
        }
        acc[lectureId].push(reflection);
        return acc;
      }, {} as Record<string, any[]>);

      // Generate markdown for each lecture
      let fullMarkdown = `# Reflections for ${reflections[0].lecture?.title || 'All Lectures'}\n\n`;

      Object.entries(reflectionsByLecture).forEach(([lectureId, lectureReflections]) => {
        const lecture = lectureReflections[0].lecture;
        fullMarkdown += reflectionsToMarkdown(lectureReflections, lecture);
        fullMarkdown += '\n\n---\n\n';
      });

      // Generate a filename
      const filename = `all_reflections.md`;

      // Return the markdown with appropriate headers for download
      return new NextResponse(fullMarkdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error) {
    console.error('Error in GET /api/reflections/export:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
