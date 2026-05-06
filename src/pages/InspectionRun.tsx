import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTicket, getInspection, updateInspection, updateInspectionItem } from '@/lib/api';
import { Loading } from '@/components/Page';
import { ItemStatusBadge } from '@/components/Badges';
import { Camera, Check, X, MinusCircle, ChevronLeft, ChevronRight, Wrench, FileCheck2 } from 'lucide-react';
import { toast } from 'sonner';
import type { InspectionItem, ItemStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

export function InspectionRun() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const q = useQuery({ queryKey: ['inspection', id], queryFn: () => getInspection(id) });
  const [idx, setIdx] = useState(0);
  const [showFinish, setShowFinish] = useState(false);

  const ins = q.data;
  const items = ins?.items ?? [];
  const item = items[idx];

  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach(it => map.set(it.category, (map.get(it.category) ?? 0) + 1));
    return Array.from(map.entries());
  }, [items]);

  const setStatus = useMutation({
    mutationFn: (patch: Partial<InspectionItem>) => updateInspectionItem(id, item!.id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inspection', id] }),
  });

  const ticketMut = useMutation({
    mutationFn: async () => {
      if (!ins || !item) throw new Error('no item');
      const t = await createTicket({
        propertyId: ins.propertyId, propertyName: ins.propertyName,
        unitId: ins.unitId, unitLabel: ins.unitLabel,
        inspectionId: ins.id, inspectionItemId: item.id,
        title: item.label,
        description: item.notes ?? `Failed inspection item — ${item.category}`,
        priority: item.severity === 'high' ? 'high' : 'medium',
        photos: item.photos,
        createdBy: user?.uid ?? 'u_insp_1',
      });
      await updateInspectionItem(id, item.id, { ticketCreated: true });
      return t;
    },
    onSuccess: () => {
      toast.success('Ticket created');
      qc.invalidateQueries({ queryKey: ['inspection', id] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  if (q.isLoading) return <div className="p-6"><Loading /></div>;
  if (!ins || !item) return <div className="p-6">Inspection not found.</div>;

  const total = items.length;
  const done = items.filter(it => it.status !== 'pending').length;
  const fails = items.filter(it => it.status === 'fail').length;
  const allDone = done === total;

  return (
    <div className="min-h-[calc(100vh-57px)] flex flex-col bg-paper dark:bg-ink">
      {/* Header */}
      <div className="border-b-3 border-ink dark:border-paper px-4 py-3 flex items-center justify-between bg-bone dark:bg-coal">
        <div>
          <p className="mono-eyebrow">// in progress</p>
          <h1 className="font-mono font-bold text-lg">{ins.unitLabel} · {ins.propertyName}</h1>
        </div>
        <Link to={`/app/inspections/${id}`} className="brut-btn !py-1.5 !px-3 text-xs">Exit</Link>
      </div>

      {/* Progress */}
      <div className="px-4 py-2 border-b-3 border-ink dark:border-paper bg-paper dark:bg-coal">
        <div className="flex items-center justify-between mb-1">
          <span className="mono-eyebrow">{done}/{total} items · {fails} failed</span>
          <span className="mono-eyebrow">{idx + 1}/{total}</span>
        </div>
        <div className="h-2 bg-bone dark:bg-slate900 border-2 border-ink dark:border-paper">
          <div className="h-full bg-hazard" style={{ width: `${(done / total) * 100}%` }} />
        </div>
      </div>

      {/* Item */}
      <div className="flex-1 p-4 sm:p-6 max-w-2xl w-full mx-auto">
        <p className="mono-eyebrow mb-2">// {item.category}</p>
        <h2 className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tighter mb-4">{item.label}</h2>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <ChoiceBtn active={item.status === 'pass'} color="ok" onClick={() => setStatus.mutate({ status: 'pass' as ItemStatus })}>
            <Check size={18} /> PASS
          </ChoiceBtn>
          <ChoiceBtn active={item.status === 'fail'} color="warn" onClick={() => setStatus.mutate({ status: 'fail' as ItemStatus, severity: item.severity ?? 'medium' })}>
            <X size={18} /> FAIL
          </ChoiceBtn>
          <ChoiceBtn active={item.status === 'na'} color="ink" onClick={() => setStatus.mutate({ status: 'na' as ItemStatus })}>
            <MinusCircle size={18} /> N/A
          </ChoiceBtn>
        </div>

        {item.status === 'fail' && (
          <div className="brut-card p-4 mb-4 border-warn">
            <label className="brut-label">Severity</label>
            <div className="flex gap-2 mb-3">
              {(['low', 'medium', 'high'] as const).map(sev => (
                <button key={sev} type="button" onClick={() => setStatus.mutate({ severity: sev })}
                  className={cn('brut-btn !py-1 !px-3 text-xs', item.severity === sev && '!bg-warn !text-paper')}>
                  {sev}
                </button>
              ))}
            </div>
            <label className="brut-label">Notes</label>
            <textarea
              className="brut-input min-h-[80px]"
              placeholder="What's wrong? What did you observe?"
              value={item.notes ?? ''}
              onChange={e => setStatus.mutate({ notes: e.target.value })}
            />
            <button
              onClick={() => ticketMut.mutate()}
              disabled={item.ticketCreated || ticketMut.isPending}
              className={cn('brut-btn-primary w-full mt-3', item.ticketCreated && 'opacity-50')}
            >
              <Wrench size={14} /> {item.ticketCreated ? 'Ticket created' : 'Create maintenance ticket'}
            </button>
          </div>
        )}

        <PhotoUploader item={item} onAdd={photo => setStatus.mutate({ photos: [...item.photos, photo] })} onRemove={p => setStatus.mutate({ photos: item.photos.filter(x => x !== p) })} />

        <div className="mt-6">
          <label className="brut-label">Notes (always visible)</label>
          <textarea
            className="brut-input min-h-[60px]"
            placeholder="Optional notes for any item"
            value={item.notes ?? ''}
            onChange={e => setStatus.mutate({ notes: e.target.value })}
          />
        </div>
      </div>

      {/* Footer nav */}
      <div className="border-t-3 border-ink dark:border-paper px-4 py-3 bg-paper dark:bg-coal sticky bottom-0">
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto">
          <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className="brut-btn"><ChevronLeft size={16} /> Prev</button>
          <span className="mono-eyebrow text-center hidden sm:block flex-1">
            <ItemStatusBadge status={item.status} />
            {item.ticketCreated && <span className="brut-tag bg-hazard ml-2">ticket</span>}
          </span>
          {idx < total - 1 ? (
            <button onClick={() => setIdx(i => Math.min(total - 1, i + 1))} className="brut-btn-primary">Next <ChevronRight size={16} /></button>
          ) : (
            <button onClick={() => setShowFinish(true)} className="brut-btn-primary"><FileCheck2 size={16} /> Finish</button>
          )}
        </div>
        {/* Section dots */}
        <div className="flex flex-wrap gap-1 mt-3 max-w-2xl mx-auto">
          {items.map((it, i) => (
            <button key={it.id} onClick={() => setIdx(i)} aria-label={`Item ${i + 1}`}
              className={cn(
                'w-5 h-5 border-2 border-ink dark:border-paper',
                i === idx && 'ring-2 ring-hazard ring-offset-1 ring-offset-paper dark:ring-offset-ink',
                it.status === 'pass' && 'bg-ok',
                it.status === 'fail' && 'bg-warn',
                it.status === 'na' && 'bg-ink',
                it.status === 'pending' && 'bg-paper dark:bg-coal',
              )} />
          ))}
        </div>
      </div>

      {showFinish && (
        <FinishModal
          inspectionId={id}
          allDone={allDone}
          onClose={() => setShowFinish(false)}
          onFinished={() => nav(`/app/inspections/${id}`)}
        />
      )}
    </div>
  );
}

function ChoiceBtn({ active, color, onClick, children }: { active: boolean; color: 'ok' | 'warn' | 'ink'; onClick: () => void; children: React.ReactNode }) {
  const map = { ok: 'bg-ok', warn: 'bg-warn text-paper', ink: 'bg-ink text-paper' };
  return (
    <button type="button" onClick={onClick}
      className={cn('border-3 border-ink dark:border-paper py-4 font-mono font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-brut transition-all',
        active ? map[color] : 'bg-paper dark:bg-coal hover:translate-x-[-1px] hover:translate-y-[-1px]')}>
      {children}
    </button>
  );
}

function PhotoUploader({ item, onAdd, onRemove }: { item: InspectionItem; onAdd: (p: string) => void; onRemove: (p: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onAdd(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  }
  return (
    <div>
      <label className="brut-label">Photos ({item.photos.length})</label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {item.photos.map(p => (
          <div key={p} className="relative aspect-square border-3 border-ink dark:border-paper">
            <img src={p} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onRemove(p)} className="absolute top-1 right-1 bg-warn text-paper border-2 border-ink p-0.5"><X size={12} /></button>
          </div>
        ))}
        <button type="button" onClick={() => ref.current?.click()} className="aspect-square border-3 border-ink dark:border-paper border-dashed grid place-items-center font-mono text-xs hover:bg-hazard">
          <Camera size={20} />
        </button>
        <input ref={ref} type="file" accept="image/*" capture="environment" onChange={handle} className="hidden" />
      </div>
    </div>
  );
}

function FinishModal({ inspectionId, allDone, onClose, onFinished }: { inspectionId: string; allDone: boolean; onClose: () => void; onFinished: () => void }) {
  const m = useMutation({
    mutationFn: () => updateInspection(inspectionId, { status: 'completed', completedAt: Date.now() }),
    onSuccess: () => { toast.success('Inspection completed'); onFinished(); },
  });
  return (
    <div className="fixed inset-0 z-50 bg-ink/60 grid place-items-center p-4" onClick={onClose}>
      <div className="brut-card w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <p className="mono-eyebrow mb-2">// finish</p>
        <h2 className="font-mono text-2xl font-extrabold tracking-tighter mb-3">Mark inspection complete?</h2>
        {!allDone && <p className="text-sm mb-4 text-warn font-mono">Heads up: some items are still pending. They'll be flagged in the report.</p>}
        <p className="text-sm mb-4">After finishing you can generate the AI condition summary and PDF report from the inspection page.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="brut-btn flex-1">Keep editing</button>
          <button onClick={() => m.mutate()} disabled={m.isPending} className="brut-btn-primary flex-1">{m.isPending ? 'Saving…' : 'Finish'}</button>
        </div>
      </div>
    </div>
  );
}
