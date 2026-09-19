import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { allNotes, noteBySlug } from "@/lib/content";

export async function generateStaticParams() {
  return (await allNotes()).map((n) => ({ slug: n.slug }));
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await noteBySlug(slug);
  if (!note) notFound();

  return (
    <>
      <h1>{note.title}</h1>
      <p className="muted">
        {note.subject}
        {note.instructor ? ` · ${note.instructor}` : ""}
        {note.updated ? ` · updated ${note.updated}` : ""}
      </p>

      {(note.practice || note.flashcards) && (
        <p>
          {note.practice && <Link href={`/practice/${note.slug}`}>Sit this practice test →</Link>}
          {note.practice && note.flashcards && <br />}
          {note.flashcards && <Link href={`/review/${note.slug}`}>Review the cards →</Link>}
        </p>
      )}

      <Markdown remarkPlugins={[remarkGfm]}>{note.body}</Markdown>
    </>
  );
}
