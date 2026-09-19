import { notFound } from "next/navigation";
import PracticeRunner from "@/components/PracticeRunner";
import { noteBySlug, practiceNotes } from "@/lib/content";
import { parseQuestions } from "@/lib/parse";

export async function generateStaticParams() {
  return (await practiceNotes()).map((n) => ({ slug: n.slug }));
}

export default async function PracticePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await noteBySlug(slug);
  if (!note || !note.practice) notFound();

  const questions = parseQuestions(note.body);
  if (questions.length === 0) {
    return (
      <>
        <h1>{note.title}</h1>
        <p className="empty">
          This note opted into practice but no questions parsed out of it. Check
          the question format in <code>site/references/content-schema.md</code>.
        </p>
      </>
    );
  }

  return (
    <>
      <h1>{note.title}</h1>
      <p className="muted">
        {note.subject} · {questions.length} questions
        {note.durationMinutes ? ` · ${note.durationMinutes} minutes` : ""}
      </p>
      <PracticeRunner questions={questions} durationMinutes={note.durationMinutes} />
    </>
  );
}
