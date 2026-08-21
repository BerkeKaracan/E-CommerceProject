export default function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, n) => (
        <div
          key={n}
          className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-4 flex flex-col h-[350px] animate-pulse"
        >
          <div className="w-full h-40 bg-neutral-200 dark:bg-neutral-800 rounded-xl mb-4" />
          <div className="w-1/3 h-3 bg-neutral-200 dark:bg-neutral-800 mx-auto rounded mb-3" />
          <div className="w-3/4 h-5 bg-neutral-200 dark:bg-neutral-800 mx-auto rounded mb-4" />
          <div className="mt-auto w-full space-y-3">
            <div className="w-1/4 h-6 bg-neutral-200 dark:bg-neutral-800 mx-auto rounded" />
            <div className="w-full h-10 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
