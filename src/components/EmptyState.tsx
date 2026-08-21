import { ReactNode } from "react";
import { EmptyCartIcon } from "@/components/Icons";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-16 px-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm text-center">
      <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4 text-neutral-300 dark:text-neutral-600">
        {icon ?? <EmptyCartIcon className="w-8 h-8" aria-hidden />}
      </div>
      <h3 className="text-base font-black text-spc-grey dark:text-white uppercase tracking-widest mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
