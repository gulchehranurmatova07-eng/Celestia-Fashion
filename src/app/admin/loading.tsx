export default function Loading() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <div className="h-8 w-48 animate-pulse bg-line/60" />
      <div className="h-4 w-80 animate-pulse bg-line/40" />
      <div className="h-64 w-full animate-pulse border border-line bg-white" />
    </div>
  );
}
