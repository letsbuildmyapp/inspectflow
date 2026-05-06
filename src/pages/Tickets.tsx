import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listTickets } from '@/lib/api';
import { PageBody, PageHeader, Loading, EmptyState } from '@/components/Page';
import { PriorityBadge, StatusBadge } from '@/components/Badges';
import { formatDate } from '@/lib/utils';
import type { TicketStatus } from '@/types';
import { cn } from '@/lib/utils';

const FILTERS: { label: string; value: TicketStatus | 'all' | 'unresolved' }[] = [
  { label: 'Unresolved', value: 'unresolved' },
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
];

export function Tickets() {
  const [filter, setFilter] = useState<TicketStatus | 'all' | 'unresolved'>('unresolved');
  const q = useQuery({ queryKey: ['tickets'], queryFn: () => listTickets() });
  const list = (q.data ?? []).filter(t =>
    filter === 'all' ? true :
    filter === 'unresolved' ? t.status !== 'resolved' :
    t.status === filter
  );

  return (
    <>
      <PageHeader eyebrow="repair queue" title="Maintenance tickets" />
      <PageBody>
        <div className="flex flex-wrap gap-2 mb-5">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={cn('brut-btn !py-1.5 !px-3 text-xs', filter === f.value && '!bg-ink !text-paper dark:!bg-paper dark:!text-ink')}>
              {f.label}
            </button>
          ))}
        </div>

        {q.isLoading && <Loading />}
        {!q.isLoading && list.length === 0 && (
          <EmptyState title="No tickets in this view" hint="Tickets are auto-created when an inspector marks an item as failed." />
        )}
        {list.length > 0 && (
          <div className="brut-card divide-y-3 divide-ink dark:divide-paper">
            {list.map(t => (
              <Link key={t.id} to={`/app/tickets/${t.id}`} className="px-4 py-4 flex items-center justify-between hover:bg-hazard/20 gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-mono font-bold truncate">{t.title}</div>
                  <div className="mono-eyebrow mt-1">{t.unitLabel} · {t.propertyName} · {formatDate(t.createdAt)}{t.assigneeName ? ` · ${t.assigneeName}` : ''}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}
