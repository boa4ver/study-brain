import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "studykit",
  description: "Study material from your own course notes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="wrap">
          <nav className="top">
            <Link href="/">Subjects</Link>
            <Link href="/practice">Practice</Link>
            <Link href="/review">Review</Link>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
