import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listInspections } from '@/lib/api';
import { PageBody, PageHeader, Loading, EmptyState } from '@/components/Page';
import { StatusBadge } from '@/components/Badges';
import { formatDateTime } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { InspectionStatus } from '@/types';
import { cn } from '@/lib/utils';

const FILTERS: { label: string; value: InspectionStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
];

export function Inspections() {
  const [filter, setFilter] = useState<InspectionStatus | 'all'>('all');
  const q = useQuery({ queryKey: ['inspections'], queryFn: () => listInspections() });
  const list = (q.data ?? []).filter(i => filter === 'all' || i.status === filter);

  return (
    <>
      <PageHeader
        eyebrow="walk · check · ship"
        title="Inspections"
        action={<Link to="/app/inspections/new" className="brut-btn-primary"><Plus size={14} /> New inspection</Link>}
      />
      <PageBody>
        <div data-tour="inspection-filters" className="flex flex-wrap gap-2 mb-5">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn('brut-btn !py-1.5 !px-3 text-xs', filter === f.value && '!bg-ink !text-paper dark:!bg-paper dark:!text-ink')}
            >
              {f.label}
            </button>
          ))}
        </div>

        {q.isLoading && <Loading />}
        {!q.isLoading && list.length === 0 && (
          <EmptyState title="No inspections in this view" hint="Try a different filter or schedule one." />
        )}
        {list.length > 0 && (
          <div className="brut-card divide-y-3 divide-ink dark:divide-paper">
            {list.map(i => {
              const fails = i.items.filter(it => it.status === 'fail').length;
              const passes = i.items.filter(it => it.status === 'pass').length;
              const total = i.items.length;
              return (
                <Link key={i.id} to={i.status === 'in_progress' ? `/app/inspections/${i.id}/run` : `/app/inspections/${i.id}`} className="px-4 py-4 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 hover:bg-hazard/20 items-center">
                  <div>
                    <div className="font-mono font-bold">{i.unitLabel} · {i.propertyName}</div>
                    <div className="mono-eyebrow mt-1">{formatDateTime(i.scheduledFor)} · {i.inspectorName}</div>
                  </div>
                  <div className="font-mono text-xs">
                    <span className="text-ok">{passes}P</span>{' / '}
                    <span className="text-warn">{fails}F</span>{' / '}
                    <span>{total}T</span>
                  </div>
                  <StatusBadge status={i.status} />
                </Link>
              );
            })}
          </div>
        )}
      </PageBody>
    </>
  );
}
