import { notFound } from "next/navigation";
import Flashcards from "@/components/Flashcards";
import { flashcardNotes, noteBySlug } from "@/lib/content";
import { parseCards } from "@/lib/parse";

export async function generateStaticParams() {
  return (await flashcardNotes()).map((n) => ({ slug: n.slug }));
}

export default async function ReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await noteBySlug(slug);
  if (!note || !note.flashcards) notFound();

  const cards = parseCards(note.body);
  if (cards.length === 0) {
    return (
      <>
        <h1>{note.title}</h1>
        <p className="empty">No cards parsed. Cards come from markdown tables.</p>
      </>
    );
  }

  return (
    <>
      <h1>{note.title}</h1>
      <p className="muted">{note.subject} · {cards.length} cards</p>
      <Flashcards deckId={note.slug} cards={cards} />
    </>
  );
}
