import Link from "next/link";
import { serif, sans } from "./fonts";

export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ivory px-6 text-center">
        <p className="eyebrow text-ink-faint">404</p>
        <h1 className="heading-display text-5xl">Page not found</h1>
        <Link href="/" className="btn-dark">Return home</Link>
      </body>
    </html>
  );
}
