import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateAiSummary, getInspection, updateInspection } from '@/lib/api';
import { Loading, PageBody, PageHeader } from '@/components/Page';
import { StatusBadge, ItemStatusBadge } from '@/components/Badges';
import { ArrowLeft, FileText, Play, Sparkles, Download } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { generatePdf } from '@/lib/pdf';

export function InspectionDetail() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['inspection', id], queryFn: () => getInspection(id) });

  const aiMut = useMutation({
    mutationFn: () => generateAiSummary(id),
    onSuccess: () => { toast.success('Condition summary generated'); qc.invalidateQueries({ queryKey: ['inspection', id] }); },
    onError: e => toast.error((e as Error).message),
  });
  const startMut = useMutation({
    mutationFn: () => updateInspection(id, { status: 'in_progress', startedAt: Date.now() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inspection', id] }),
  });

  if (q.isLoading) return <Loading />;
  if (!q.data) return <PageBody><div className="brut-card p-8">Inspection not found.</div></PageBody>;

  const ins = q.data;
  const fails = ins.items.filter(i => i.status === 'fail');
  const passes = ins.items.filter(i => i.status === 'pass');
  const pending = ins.items.filter(i => i.status === 'pending');
  const grouped = ins.items.reduce<Record<string, typeof ins.items>>((acc, it) => {
    (acc[it.category] ||= []).push(it); return acc;
  }, {});

  return (
    <>
      <PageHeader
        eyebrow={`// ${ins.status.replace('_', ' ')}`}
        title={`${ins.unitLabel} — ${ins.propertyName}`}
        action={
          <div className="flex gap-2 flex-wrap">
            <Link to="/app/inspections" className="brut-btn"><ArrowLeft size={14} /> Back</Link>
            {ins.status === 'scheduled' && (
              <button onClick={() => startMut.mutate()} className="brut-btn-primary"><Play size={14} /> Start</button>
            )}
            {ins.status === 'in_progress' && (
              <Link to={`/app/inspections/${id}/run`} className="brut-btn-primary"><Play size={14} /> Resume</Link>
            )}
          </div>
        }
      >
        <p className="text-sm mt-2">
          Inspector: {ins.inspectorName} · Scheduled: {formatDateTime(ins.scheduledFor)}
          {ins.completedAt && ` · Completed: ${formatDateTime(ins.completedAt)}`}
        </p>
      </PageHeader>

      <PageBody className="space-y-6">
        <div className="grid sm:grid-cols-4 gap-4">
          <Tile label="Pass" value={passes.length} />
          <Tile label="Fail" value={fails.length} hot={fails.length > 0} />
          <Tile label="Pending" value={pending.length} />
          <Tile label="Total" value={ins.items.length} />
        </div>

        {ins.status === 'completed' && (
          <section className="brut-card">
            <header className="px-4 py-3 border-b-3 border-ink dark:border-paper flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-mono font-bold uppercase tracking-wider flex items-center gap-2"><Sparkles size={16} /> AI condition summary</h2>
              <div className="flex gap-2">
                <button onClick={() => aiMut.mutate()} disabled={aiMut.isPending} className="brut-btn !py-1.5 !px-3 text-xs">
                  {aiMut.isPending ? 'Generating…' : ins.aiSummary ? 'Regenerate' : 'Generate summary'}
                </button>
                <button onClick={() => generatePdf(ins)} className="brut-btn-primary !py-1.5 !px-3 text-xs"><Download size={12} /> PDF</button>
              </div>
            </header>
            <div className="p-4">
              {ins.aiSummary ? (
                <div>
                  <p className="font-mono text-[15px] leading-relaxed whitespace-pre-wrap">{ins.aiSummary}</p>
                  <p className="mono-eyebrow mt-3">cached: {formatDateTime(ins.aiSummaryCachedAt)} · model: claude-sonnet-4-6</p>
                </div>
              ) : (
                <p className="text-sm text-ink/70 dark:text-paper/70 font-mono">No summary yet. Click "Generate summary" to run the Cloud Function (or fixture fallback if no API key set).</p>
              )}
            </div>
          </section>
        )}

        {ins.generalNotes && (
          <section className="brut-card p-4">
            <p className="mono-eyebrow mb-2">// inspector notes</p>
            <p className="font-mono text-sm whitespace-pre-wrap">{ins.generalNotes}</p>
          </section>
        )}

        <section className="brut-card">
          <header className="px-4 py-3 border-b-3 border-ink dark:border-paper flex items-center justify-between">
            <h2 className="font-mono font-bold uppercase tracking-wider flex items-center gap-2"><FileText size={16} /> Checklist</h2>
            <span className="mono-eyebrow">{ins.items.length} items</span>
          </header>
          <div className="divide-y-3 divide-ink dark:divide-paper">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="bg-bone dark:bg-slate900 px-4 py-2 font-mono text-xs uppercase tracking-widest font-bold">{cat}</div>
                <ul className="divide-y-2 divide-ink/30 dark:divide-paper/30">
                  {items.map(it => (
                    <li key={it.id} className="px-4 py-3 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-mono text-sm">{it.label}</div>
                        {it.notes && <div className="mono-eyebrow mt-1 normal-case tracking-normal">{it.notes}</div>}
                        {it.photos.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {it.photos.slice(0, 4).map(p => <img key={p} src={p} alt="" className="w-12 h-12 object-cover border-2 border-ink dark:border-paper" />)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <ItemStatusBadge status={it.status} />
                        {it.ticketCreated && <span className="brut-tag bg-hazard">ticket</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </PageBody>
    </>
  );
}

function Tile({ label, value, hot }: { label: string; value: number; hot?: boolean }) {
  return (
    <div className={'brut-card p-4 ' + (hot ? '!bg-warn !text-paper' : '')}>
      <p className="mono-eyebrow !text-current opacity-70">{label}</p>
      <p className="font-mono text-4xl font-extrabold tracking-tighter">{value}</p>
    </div>
  );
}
