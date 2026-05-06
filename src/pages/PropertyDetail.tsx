import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createUnit, getProperty, listInspections, listUnits } from '@/lib/api';
import { PageBody, PageHeader, Loading } from '@/components/Page';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/Badges';
import { formatDateTime } from '@/lib/utils';

export function PropertyDetail() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const prop = useQuery({ queryKey: ['property', id], queryFn: () => getProperty(id) });
  const units = useQuery({ queryKey: ['units', id], queryFn: () => listUnits(id) });
  const insps = useQuery({ queryKey: ['inspections', { propertyId: id }], queryFn: () => listInspections({ propertyId: id }) });

  if (prop.isLoading) return <Loading />;
  if (!prop.data) return <PageBody><div className="brut-card p-8">Property not found.</div></PageBody>;

  const p = prop.data;
  return (
    <>
      <PageHeader
        eyebrow={`// ${p.city}, ${p.state}`}
        title={p.name}
        action={<Link to="/app/properties" className="brut-btn"><ArrowLeft size={14} /> All properties</Link>}
      >
        <p className="text-sm mt-2">{p.address}, {p.city}, {p.state} {p.zip} · est. {p.yearBuilt} · {p.type}</p>
      </PageHeader>

      <PageBody className="space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono font-bold uppercase tracking-wider">Units ({units.data?.length ?? 0})</h2>
            <button onClick={() => setShowNew(true)} className="brut-btn-primary !py-2"><Plus size={14} /> Unit</button>
          </div>
          {units.isLoading && <Loading />}
          {units.data && units.data.length === 0 && (
            <div className="brut-card p-6 font-mono text-sm">No units yet. Add one to schedule inspections.</div>
          )}
          {units.data && units.data.length > 0 && (
            <div className="brut-card divide-y-3 divide-ink dark:divide-paper">
              {units.data.map(u => (
                <div key={u.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold">{u.label}</div>
                    <div className="mono-eyebrow mt-1">
                      {u.bedrooms != null && `${u.bedrooms}bd / ${u.bathrooms}ba · `}{u.sqft && `${u.sqft.toLocaleString()} sqft`}
                      {u.tenant && ` · tenant: ${u.tenant}`}
                    </div>
                  </div>
                  <Link to={`/app/inspections/new?propertyId=${p.id}&unitId=${u.id}`} className="brut-btn !py-1.5 !px-3 text-xs">Schedule</Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-mono font-bold uppercase tracking-wider mb-4">Inspections</h2>
          {insps.isLoading && <Loading />}
          {insps.data && insps.data.length === 0 && (
            <div className="brut-card p-6 font-mono text-sm">No inspections recorded for this property yet.</div>
          )}
          {insps.data && insps.data.length > 0 && (
            <div className="brut-card divide-y-3 divide-ink dark:divide-paper">
              {insps.data.map(i => (
                <Link key={i.id} to={i.status === 'in_progress' ? `/app/inspections/${i.id}/run` : `/app/inspections/${i.id}`} className="px-4 py-3 flex items-center justify-between hover:bg-hazard/20">
                  <div>
                    <div className="font-mono font-bold">{i.unitLabel}</div>
                    <div className="mono-eyebrow mt-1">{formatDateTime(i.scheduledFor)} · {i.inspectorName}</div>
                  </div>
                  <StatusBadge status={i.status} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </PageBody>

      {showNew && (
        <NewUnitModal propertyId={p.id} onClose={() => setShowNew(false)} onCreated={() => { qc.invalidateQueries({ queryKey: ['units', id] }); qc.invalidateQueries({ queryKey: ['property', id] }); }} />
      )}
    </>
  );
}

function NewUnitModal({ propertyId, onClose, onCreated }: { propertyId: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ label: '', bedrooms: 1, bathrooms: 1, sqft: 700, tenant: '' });
  const m = useMutation({
    mutationFn: () => createUnit({ propertyId, label: form.label, bedrooms: form.bedrooms, bathrooms: form.bathrooms, sqft: form.sqft, tenant: form.tenant || undefined }),
    onSuccess: () => { toast.success('Unit created'); onCreated(); onClose(); },
    onError: e => toast.error((e as Error).message),
  });
  return (
    <div className="fixed inset-0 z-50 bg-ink/60 grid place-items-center p-4" onClick={onClose}>
      <div className="brut-card w-full max-w-md" onClick={e => e.stopPropagation()}>
        <header className="px-4 py-3 border-b-3 border-ink dark:border-paper flex items-center justify-between">
          <h2 className="font-mono font-bold uppercase tracking-wider">New unit</h2>
          <button onClick={onClose} className="font-mono text-xs">✕</button>
        </header>
        <form onSubmit={e => { e.preventDefault(); m.mutate(); }} className="p-4 space-y-3">
          <div><label className="brut-label">Label</label><input required className="brut-input" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. Unit 5B" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="brut-label">Beds</label><input type="number" className="brut-input" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: Number(e.target.value) })} /></div>
            <div><label className="brut-label">Baths</label><input type="number" className="brut-input" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: Number(e.target.value) })} /></div>
            <div><label className="brut-label">Sqft</label><input type="number" className="brut-input" value={form.sqft} onChange={e => setForm({ ...form, sqft: Number(e.target.value) })} /></div>
          </div>
          <div><label className="brut-label">Tenant (optional)</label><input className="brut-input" value={form.tenant} onChange={e => setForm({ ...form, tenant: e.target.value })} /></div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="brut-btn flex-1">Cancel</button>
            <button type="submit" disabled={m.isPending} className="brut-btn-primary flex-1">{m.isPending ? 'Saving…' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
