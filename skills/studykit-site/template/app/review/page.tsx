import Link from "next/link";
import { flashcardNotes } from "@/lib/content";

export default async function ReviewIndex() {
  const notes = await flashcardNotes();

  return (
    <>
      <h1>Review</h1>
      {notes.length === 0 ? (
        <p className="empty">
          No decks. Flashcards are opt-in: add <code>studykit.flashcards: true</code>{" "}
          to a note when you actually want its tables as cards.
        </p>
      ) : (
        <ul className="list">
          {notes.map((n) => (
            <li key={n.slug} className="row">
              <Link href={`/review/${n.slug}`}>{n.title}</Link>
              <span className="muted">{n.subject}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
