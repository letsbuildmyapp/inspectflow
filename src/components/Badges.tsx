import { cn } from '@/lib/utils';
import type { InspectionStatus, ItemStatus, TicketPriority, TicketStatus } from '@/types';

export function StatusBadge({ status }: { status: InspectionStatus | TicketStatus }) {
  const m: Record<string, string> = {
    scheduled: 'bg-bone dark:bg-slate900',
    in_progress: 'bg-hazard text-ink',
    completed: 'bg-ok text-ink',
    canceled: 'bg-ink text-paper',
    open: 'bg-warn text-paper',
    assigned: 'bg-bone dark:bg-slate900',
    resolved: 'bg-ok text-ink',
  };
  return <span className={cn('brut-tag', m[status] ?? '')}>{status.replace('_', ' ')}</span>;
}

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  const m: Record<ItemStatus, string> = {
    pending: 'bg-bone dark:bg-slate900',
    pass: 'bg-ok text-ink',
    fail: 'bg-warn text-paper',
    na: 'bg-ink text-paper',
  };
  return <span className={cn('brut-tag', m[status])}>{status === 'na' ? 'N/A' : status}</span>;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const m: Record<TicketPriority, string> = {
    low: 'bg-bone dark:bg-slate900',
    medium: 'bg-hazard text-ink',
    high: 'bg-warn text-paper',
    urgent: 'bg-ink text-paper border-warn',
  };
  return <span className={cn('brut-tag', m[priority])}>{priority}</span>;
}
