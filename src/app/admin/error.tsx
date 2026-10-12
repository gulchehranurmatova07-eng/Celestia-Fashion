"use client";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const denied = /administrator access/i.test(error.message);
  return (
    <div className="border border-line bg-white px-6 py-10 text-center">
      <p className="eyebrow mb-2 text-ink-faint">{denied ? "403" : "Error"}</p>
      <h1 className="font-serif text-3xl font-light">{denied ? "Access denied" : "Something went wrong"}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
        {denied ? "Administrator access is required." : "The page could not be loaded. Try again, or check the server log."}
        {error.digest ? <span className="mt-1 block text-xs text-ink-faint">Reference: {error.digest}</span> : null}
      </p>
      {!denied ? (
        <button type="button" onClick={reset} className="btn-outline mt-6">
          Try again
        </button>
      ) : null}
    </div>
  );
}
