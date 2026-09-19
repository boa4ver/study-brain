import Link from "next/link";
import { notFound } from "next/navigation";
import { notesForSubject, subjects } from "@/lib/content";

export async function generateStaticParams() {
  return (await subjects()).map((s) => ({ slug: s.slug }));
}

export default async function SubjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const notes = await notesForSubject(slug);
  if (notes.length === 0) notFound();

  const active = notes.filter((n) => !n.archived);
  const archived = notes.filter((n) => n.archived);

  return (
    <>
      <h1>{notes[0].subject}</h1>
      {notes[0].instructor && <p className="muted">{notes[0].instructor}</p>}

      <h2>Notes</h2>
      <ul className="list">
        {active.map((n) => (
          <li key={n.slug} className="row">
            <Link href={`/note/${n.slug}`}>{n.title}</Link>
            <span>
              {n.practice && <span className="badge">practice</span>}
              {n.flashcards && <span className="badge">cards</span>}
            </span>
          </li>
        ))}
      </ul>

      {archived.length > 0 && (
        <>
          <h2>Archive</h2>
          <ul className="list">
            {archived.map((n) => (
              <li key={n.slug}>
                <Link href={`/note/${n.slug}`}>{n.title}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
