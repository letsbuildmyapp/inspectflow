import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTicket, listUsers, updateTicket } from '@/lib/api';
import { PageBody, PageHeader, Loading } from '@/components/Page';
import { PriorityBadge, StatusBadge } from '@/components/Badges';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';
import type { TicketPriority, TicketStatus } from '@/types';

export function TicketDetail() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['ticket', id], queryFn: () => getTicket(id) });
  const users = useQuery({ queryKey: ['users'], queryFn: listUsers });
  const t = q.data;

  const [resolution, setResolution] = useState('');

  const m = useMutation({
    mutationFn: (patch: any) => updateTicket(id, patch),
    onSuccess: () => {
      toast.success('Ticket updated');
      qc.invalidateQueries({ queryKey: ['ticket', id] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  if (q.isLoading) return <Loading />;
  if (!t) return <PageBody><div className="brut-card p-8">Ticket not found.</div></PageBody>;

  return (
    <>
      <PageHeader
        eyebrow="ticket"
        title={t.title}
        action={<Link to="/app/tickets" className="brut-btn"><ArrowLeft size={14} /> All tickets</Link>}
      >
        <div className="flex gap-2 mt-2">
          <PriorityBadge priority={t.priority} />
          <StatusBadge status={t.status} />
        </div>
      </PageHeader>

      <PageBody className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <div className="brut-card p-4">
            <p className="mono-eyebrow mb-2">// description</p>
            <p className="font-mono text-sm whitespace-pre-wrap">{t.description}</p>
          </div>

          {t.photos.length > 0 && (
            <div className="brut-card p-4">
              <p className="mono-eyebrow mb-3">// photos</p>
              <div className="grid grid-cols-3 gap-2">
                {t.photos.map(p => <img key={p} src={p} alt="" className="aspect-square object-cover border-3 border-ink dark:border-paper" />)}
              </div>
            </div>
          )}

          {t.status !== 'resolved' && (
            <div className="brut-card p-4">
              <p className="mono-eyebrow mb-2">// resolve</p>
              <label className="brut-label">Resolution notes</label>
              <textarea className="brut-input min-h-[80px]" value={resolution} onChange={e => setResolution(e.target.value)} placeholder="What did you do? Parts? Time?" />
              <button
                onClick={() => m.mutate({ status: 'resolved' as TicketStatus, resolutionNotes: resolution || 'Resolved.' })}
                className="brut-btn-primary w-full mt-3"
              >Mark resolved</button>
            </div>
          )}

          {t.resolutionNotes && (
            <div className="brut-card p-4 bg-ok/30">
              <p className="mono-eyebrow mb-2">// resolved {formatDateTime(t.resolvedAt)}</p>
              <p className="font-mono text-sm whitespace-pre-wrap">{t.resolutionNotes}</p>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="brut-card p-4">
            <p className="mono-eyebrow mb-2">// location</p>
            <p className="font-mono text-sm font-bold">{t.unitLabel}</p>
            <Link to={`/app/properties/${t.propertyId}`} className="text-sm underline">{t.propertyName}</Link>
          </div>

          <div className="brut-card p-4">
            <label className="brut-label">Status</label>
            <select className="brut-input" value={t.status} onChange={e => m.mutate({ status: e.target.value as TicketStatus })}>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="brut-card p-4">
            <label className="brut-label">Priority</label>
            <select className="brut-input" value={t.priority} onChange={e => m.mutate({ priority: e.target.value as TicketPriority })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="brut-card p-4">
            <label className="brut-label">Assignee</label>
            <select className="brut-input" value={t.assigneeId ?? ''} onChange={e => {
              const u = users.data?.find(x => x.uid === e.target.value);
              m.mutate({ assigneeId: u?.uid, assigneeName: u?.name, status: u && t.status === 'open' ? 'assigned' : t.status });
            }}>
              <option value="">— Unassigned —</option>
              {users.data?.filter(u => u.role !== 'manager').map(u => <option key={u.uid} value={u.uid}>{u.name}</option>)}
            </select>
          </div>

          {t.inspectionId && (
            <div className="brut-card p-4">
              <p className="mono-eyebrow mb-1">// origin</p>
              <Link to={`/app/inspections/${t.inspectionId}`} className="font-mono text-sm underline">From inspection →</Link>
            </div>
          )}
        </aside>
      </PageBody>
    </>
  );
}
