import { cn } from '@/lib/utils';

/**
 * Loading placeholder (DESIGN.md §4.2 SKELETON): opacity shimmer only, no scale/
 * bounce (§5 motion rules). Radius should match whatever element it replaces —
 * pass a radius utility via `className`.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[var(--color-bg-input)]', className)}
      {...props}
    />
  );
}

export { Skeleton };
