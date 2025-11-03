import type { Metadata } from 'next';
import { lessonsData } from '@/lib/data/lessons';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const lessonNumber = parseInt(id);
  const lesson = lessonsData.find((l) => l.lessonNumber === lessonNumber);

  if (!lesson) {
    return {
      title: 'Lesson Not Found',
      description: 'The requested typing lesson could not be found.',
    };
  }

  return {
    title: `Lesson ${lesson.lessonNumber}: ${lesson.title}`,
    description: `Practice ${lesson.focusKeys.join(', ')} keys. ${lesson.exercises.length} exercises. Difficulty: ${lesson.difficulty}. Estimated time: ${lesson.estimatedTime} minutes.`,
    keywords: [
      'typing lesson',
      'touch typing',
      lesson.title,
      ...lesson.focusKeys.map(key => `${key} key practice`),
      `${lesson.difficulty} typing`,
    ],
    openGraph: {
      title: `Lesson ${lesson.lessonNumber}: ${lesson.title} | Typing Toy`,
      description: `Practice ${lesson.focusKeys.join(', ')} keys with ${lesson.exercises.length} exercises.`,
      url: `/lessons/${lesson.lessonNumber}`,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `Lesson ${lesson.lessonNumber}: ${lesson.title}`,
      description: `Practice ${lesson.focusKeys.join(', ')} keys with ${lesson.exercises.length} exercises.`,
    },
    alternates: {
      canonical: `/lessons/${lesson.lessonNumber}`,
    },
  };
}

export default function LessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
