import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({ eyebrow, title, action, children }: { eyebrow?: string; title: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <div className="border-b-3 border-ink dark:border-paper">
      <div className="px-4 lg:px-8 py-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow && <p className="mono-eyebrow mb-2">// {eyebrow}</p>}
          <h1 className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tighter">{title}</h1>
          {children}
        </div>
        {action}
      </div>
    </div>
  );
}

export function PageBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-4 lg:px-8 py-6', className)}>{children}</div>;
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="brut-card p-10 text-center">
      <div className="mono-eyebrow mb-3">// no data</div>
      <h3 className="font-mono text-xl font-bold mb-2">{title}</h3>
      {hint && <p className="text-sm text-ink/70 dark:text-paper/70 max-w-md mx-auto">{hint}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="brut-card p-8 text-center">
      <div className="font-mono text-xs uppercase tracking-widest animate-pulse">{label}…</div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="brut-card p-8 text-center border-warn">
      <div className="font-mono text-xs uppercase tracking-widest mb-3 text-warn">// error</div>
      <p className="font-mono text-sm mb-4">{message}</p>
      {onRetry && <button onClick={onRetry} className="brut-btn">Retry</button>}
    </div>
  );
}
