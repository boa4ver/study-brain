import Link from "next/link";
import { practiceNotes } from "@/lib/content";

export default async function PracticeIndex() {
  const notes = await practiceNotes();

  return (
    <>
      <h1>Practice</h1>
      {notes.length === 0 ? (
        <p className="empty">
          Nothing here yet. Practice is opt-in: a note becomes runnable when it
          carries <code>study-brain.practice: true</code>, and not before.
        </p>
      ) : (
        <ul className="list">
          {notes.map((n) => (
            <li key={n.slug} className="row">
              <Link href={`/practice/${n.slug}`}>{n.title}</Link>
              <span className="muted">{n.subject}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
