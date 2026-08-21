export default function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, n) => (
        <div
          key={n}
          className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 rounded-2xl overflow-hidden flex flex-col animate-pulse"
        >
          <div className="w-full aspect-3/4 bg-neutral-200 dark:bg-neutral-800" />
          <div className="p-3.5 space-y-2">
            <div className="w-1/3 h-3 bg-neutral-200 dark:bg-neutral-800 mx-auto rounded" />
            <div className="w-3/4 h-4 bg-neutral-200 dark:bg-neutral-800 mx-auto rounded" />
            <div className="w-1/4 h-5 bg-neutral-200 dark:bg-neutral-800 mx-auto rounded mt-3" />
            <div className="w-full h-10 bg-neutral-200 dark:bg-neutral-800 rounded-xl mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
