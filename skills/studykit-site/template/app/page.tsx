import Link from "next/link";
import { subjects, upcoming } from "@/lib/content";

export default async function Home() {
  const [list, soon] = await Promise.all([subjects(), upcoming()]);

  if (list.length === 0) {
    return (
      <>
        <h1>studykit</h1>
        <p className="empty">
          No notes yet. Run <code>npm run sync</code> to mirror your allowlisted
          folders into <code>content/vault</code>, then reload.
        </p>
      </>
    );
  }

  return (
    <>
      <h1>studykit</h1>
      <p className="muted">{list.length} subjects</p>

      {soon.length > 0 && (
        <>
          <h2>Coming up</h2>
          <ul className="list">
            {soon.slice(0, 6).map((item, i) => (
              <li key={i} className="row">
                <span>
                  {item.name}
                  <span className="badge">{item.subject}</span>
                </span>
                <span className="muted">
                  {item.at.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>Subjects</h2>
      <ul className="list">
        {list.map((s) => (
          <li key={s.slug} className="row">
            <Link href={`/subject/${s.slug}`}>{s.name}</Link>
            <span className="muted">{s.count}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
