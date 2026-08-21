import { ReactNode } from "react";
import { ErrorIcon, RefreshIcon } from "@/components/Icons";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: ReactNode;
}

export default function ErrorState({
  title = "Connection Lost",
  description = "We couldn't load this content. Please check your connection and try again.",
  onRetry,
  action,
}: ErrorStateProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-20 px-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm text-center">
      <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
        <ErrorIcon className="w-8 h-8 text-red-500" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-spc-grey dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm">
        {description}
      </p>
      {action ??
        (onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="bg-spc-grey dark:bg-neutral-800 hover:bg-btn-green dark:hover:bg-btn-green text-white px-8 py-3 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-colors flex items-center gap-2"
          >
            <RefreshIcon className="w-4 h-4" aria-hidden />
            Try Again
          </button>
        ))}
    </div>
  );
}
