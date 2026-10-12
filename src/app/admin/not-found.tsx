import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="border border-line bg-white px-6 py-10 text-center">
      <h1 className="font-serif text-3xl font-light">Not found</h1>
      <p className="mt-2 text-sm text-ink-soft">This record does not exist or was deleted.</p>
      <Link href="/admin" className="mt-4 inline-block text-xs underline underline-offset-4">
        Back to dashboard
      </Link>
    </div>
  );
}
