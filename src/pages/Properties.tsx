import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createProperty, listProperties } from '@/lib/api';
import { PageBody, PageHeader, Loading, EmptyState } from '@/components/Page';
import { Building2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

export function Properties() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const q = useQuery({ queryKey: ['properties'], queryFn: listProperties });
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  return (
    <>
      <PageHeader
        eyebrow="portfolio"
        title="Properties"
        action={isAdmin && (
          <button onClick={() => setShowNew(true)} className="brut-btn-primary"><Plus size={14} /> New property</button>
        )}
      />
      <PageBody>
        {q.isLoading && <Loading />}
        {!q.isLoading && (q.data?.length ?? 0) === 0 && (
          <EmptyState title="No properties yet" hint="Add your first property to start scheduling inspections." />
        )}
        {!q.isLoading && (q.data?.length ?? 0) > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {q.data!.map(p => (
              <Link key={p.id} to={`/app/properties/${p.id}`} className="brut-card overflow-hidden block hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutLg transition-all">
                <div className="aspect-[16/9] border-b-3 border-ink dark:border-paper bg-bone dark:bg-slate900 overflow-hidden relative">
                  {p.photoUrl ? (
                    <img
                      src={p.photoUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.style.display = 'none';
                        const fallback = img.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = 'grid';
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full grid place-items-center bg-bone dark:bg-slate900 absolute inset-0"
                    style={{ display: p.photoUrl ? 'none' : 'grid' }}
                  >
                    <Building2 size={36} className="opacity-40" />
                  </div>
                </div>
                <div className="p-4">
                  <p className="mono-eyebrow">// {p.type}</p>
                  <h3 className="font-mono font-bold text-lg mt-1">{p.name}</h3>
                  <p className="text-sm text-ink/70 dark:text-paper/70 mt-1">{p.address}, {p.city}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="brut-tag">{p.unitCount} units</span>
                    <span className="brut-tag">est. {p.yearBuilt}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageBody>
      {showNew && <NewPropertyModal onClose={() => setShowNew(false)} onCreated={() => { qc.invalidateQueries({ queryKey: ['properties'] }); }} />}
    </>
  );
}

function NewPropertyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', address: '', city: '', state: 'TX', zip: '', type: 'residential' as 'residential' | 'commercial' | 'mixed', yearBuilt: 2010 });
  const m = useMutation({
    mutationFn: () => createProperty({
      ...form,
      managerId: user?.uid ?? 'u_mgr_1',
      managerName: user?.name ?? 'Jordan Park',
    }),
    onSuccess: () => { toast.success('Property created'); onCreated(); onClose(); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <div className="fixed inset-0 z-50 bg-ink/60 grid place-items-center p-4" onClick={onClose}>
      <div className="brut-card w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <header className="px-4 py-3 border-b-3 border-ink dark:border-paper flex items-center justify-between">
          <h2 className="font-mono font-bold uppercase tracking-wider">New property</h2>
          <button onClick={onClose} className="font-mono text-xs">✕</button>
        </header>
        <form onSubmit={e => { e.preventDefault(); m.mutate(); }} className="p-4 space-y-3">
          <div><label className="brut-label">Name</label><input required className="brut-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Maple Court Apartments" /></div>
          <div><label className="brut-label">Street address</label><input required className="brut-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><label className="brut-label">City</label><input required className="brut-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="brut-label">State</label><input required className="brut-input" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="brut-label">ZIP</label><input required className="brut-input" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} /></div>
            <div><label className="brut-label">Year built</label><input required type="number" className="brut-input" value={form.yearBuilt} onChange={e => setForm({ ...form, yearBuilt: Number(e.target.value) })} /></div>
          </div>
          <div>
            <label className="brut-label">Type</label>
            <select className="brut-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="mixed">Mixed-use</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="brut-btn flex-1">Cancel</button>
            <button type="submit" disabled={m.isPending} className="brut-btn-primary flex-1">{m.isPending ? 'Saving…' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
