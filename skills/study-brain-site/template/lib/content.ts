// Read the mirrored markdown in content/vault. Server-side only.

import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import matter from "gray-matter";

export type Exam = {
  name: string;
  date?: string;
  startsAt?: string;
  endsAt?: string;
  status?: "upcoming" | "completed" | "cancelled" | "superseded";
  scope?: string;
};

export type Task = {
  name: string;
  due?: string;
  /** Absent when no source stated one. Never guessed. */
  points?: number;
  status?: "open" | "submitted" | "graded";
};

export type Note = {
  slug: string;
  path: string;
  title: string;
  subject: string;
  type: string;
  updated?: string;
  instructor?: string;
  exams: Exam[];
  tasks: Task[];
  practice: boolean;
  flashcards: boolean;
  assessmentId?: string;
  durationMinutes?: number;
  archived: boolean;
  body: string;
};

const ROOT = join(process.cwd(), "content", "vault");

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (entry.name.toLowerCase().endsWith(".md")) out.push(full);
  }
  return out;
}

let cache: Note[] | null = null;

export async function allNotes(): Promise<Note[]> {
  if (cache) return cache;
  if (!existsSync(ROOT)) return [];

  const notes: Note[] = [];

  for (const file of await walk(ROOT)) {
    const { data, content } = matter(await readFile(file, "utf8"));
    const rel = relative(ROOT, file);

    // A note with no subject belongs to nothing and would be invisible.
    // Fall back to its top-level folder rather than dropping it silently.
    const subject = String(data.subject ?? rel.split("/")[0] ?? "").trim();
    if (!subject) continue;

    const title = String(data.title ?? rel.replace(/\.md$/, "").split("/").pop() ?? "Untitled");
    const sk = (data.studybrain ?? {}) as Record<string, unknown>;

    notes.push({
      slug: slugify(`${subject}-${title}`),
      path: rel,
      title,
      subject,
      type: String(data.type ?? "lesson"),
      updated: data.updated ? String(data.updated) : undefined,
      instructor: data.instructor ? String(data.instructor) : undefined,
      exams: Array.isArray(data.exams) ? (data.exams as Exam[]) : [],
      tasks: Array.isArray(data.tasks) ? (data.tasks as Task[]) : [],
      practice: sk.practice === true,
      flashcards: sk.flashcards === true,
      assessmentId: sk.assessmentId ? String(sk.assessmentId) : undefined,
      durationMinutes: typeof sk.durationMinutes === "number" ? sk.durationMinutes : undefined,
      archived: rel.split("/").includes("Archive"),
      body: content,
    });
  }

  cache = notes.sort((a, b) => a.title.localeCompare(b.title));
  return cache;
}

export async function subjects(): Promise<{ name: string; slug: string; count: number }[]> {
  const notes = await allNotes();
  const counts = new Map<string, number>();
  for (const n of notes) counts.set(n.subject, (counts.get(n.subject) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: slugify(name), count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function notesForSubject(slug: string): Promise<Note[]> {
  return (await allNotes()).filter((n) => slugify(n.subject) === slug);
}

export async function noteBySlug(slug: string): Promise<Note | undefined> {
  return (await allNotes()).find((n) => n.slug === slug);
}

/** Only notes that explicitly opted in are runnable. */
export async function practiceNotes(): Promise<Note[]> {
  return (await allNotes()).filter((n) => n.practice && !n.archived);
}

export async function flashcardNotes(): Promise<Note[]> {
  return (await allNotes()).filter((n) => n.flashcards && !n.archived);
}

/**
 * Exams and tasks still ahead, nearest first. A cancelled or superseded exam
 * never appears, and one whose end has passed drops out on its own.
 */
export async function upcoming(now = new Date()) {
  const notes = await allNotes();
  const items: { kind: "exam" | "task"; name: string; subject: string; at: Date; scope?: string }[] = [];

  for (const note of notes) {
    for (const exam of note.exams) {
      if (exam.status === "cancelled" || exam.status === "superseded" || exam.status === "completed") continue;
      const raw = exam.endsAt ?? exam.startsAt ?? exam.date;
      if (!raw) continue;
      const at = new Date(raw);
      if (Number.isNaN(at.getTime()) || at < now) continue;
      items.push({ kind: "exam", name: exam.name, subject: note.subject, at, scope: exam.scope });
    }
    for (const task of note.tasks) {
      if (task.status === "submitted" || task.status === "graded" || !task.due) continue;
      const at = new Date(task.due);
      if (Number.isNaN(at.getTime()) || at < now) continue;
      items.push({ kind: "task", name: task.name, subject: note.subject, at });
    }
  }

  return items.sort((a, b) => a.at.getTime() - b.at.getTime());
}
