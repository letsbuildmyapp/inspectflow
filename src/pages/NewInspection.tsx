import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createInspection, listProperties, listUnits, listUsers } from '@/lib/api';
import { PageBody, PageHeader } from '@/components/Page';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

export function NewInspection() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const props = useQuery({ queryKey: ['properties'], queryFn: listProperties });
  const users = useQuery({ queryKey: ['users'], queryFn: listUsers });

  const [propertyId, setPropertyId] = useState(params.get('propertyId') ?? '');
  const [unitId, setUnitId] = useState(params.get('unitId') ?? '');
  const [inspectorId, setInspectorId] = useState(user?.role === 'inspector' ? user.uid : '');
  const [scheduledFor, setScheduledFor] = useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    d.setMinutes(0); d.setSeconds(0); d.setMilliseconds(0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });

  const units = useQuery({ queryKey: ['units', propertyId], queryFn: () => listUnits(propertyId), enabled: !!propertyId });

  useEffect(() => { if (propertyId && !params.get('unitId')) setUnitId(''); }, [propertyId, params]);

  const property = useMemo(() => props.data?.find(p => p.id === propertyId), [props.data, propertyId]);
  const unit = useMemo(() => units.data?.find(u => u.id === unitId), [units.data, unitId]);
  const inspector = users.data?.find(u => u.uid === inspectorId);

  const m = useMutation({
    mutationFn: async () => {
      if (!property || !unit || !inspector) throw new Error('Pick property, unit, and inspector');
      const tpl: 'residential' | 'commercial' = property.type === 'commercial' ? 'commercial' : 'residential';
      return createInspection({
        propertyId: property.id,
        propertyName: property.name,
        unitId: unit.id,
        unitLabel: unit.label,
        inspectorId: inspector.uid,
        inspectorName: inspector.name,
        scheduledFor: new Date(scheduledFor).getTime(),
        items: [],
        template: tpl,
      } as any);
    },
    onSuccess: ins => { toast.success('Inspection scheduled'); nav(`/app/inspections/${ins.id}`); },
    onError: e => toast.error((e as Error).message),
  });

  return (
    <>
      <PageHeader eyebrow="schedule" title="New inspection" />
      <PageBody>
        <form onSubmit={e => { e.preventDefault(); m.mutate(); }} className="brut-card p-6 max-w-2xl space-y-4">
          <div>
            <label className="brut-label">Property</label>
            <select required className="brut-input" value={propertyId} onChange={e => setPropertyId(e.target.value)}>
              <option value="">— Select property —</option>
              {props.data?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="brut-label">Unit</label>
            <select required className="brut-input" value={unitId} onChange={e => setUnitId(e.target.value)} disabled={!propertyId}>
              <option value="">— Select unit —</option>
              {units.data?.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
          <div>
            <label className="brut-label">Inspector</label>
            <select required className="brut-input" value={inspectorId} onChange={e => setInspectorId(e.target.value)}>
              <option value="">— Assign inspector —</option>
              {users.data?.filter(u => u.role === 'inspector' || u.role === 'admin').map(u => <option key={u.uid} value={u.uid}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <div>
            <label className="brut-label">Scheduled for</label>
            <input required type="datetime-local" className="brut-input" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} />
          </div>
          <div className="pt-2 flex gap-2">
            <button type="button" onClick={() => nav(-1)} className="brut-btn">Cancel</button>
            <button type="submit" disabled={m.isPending} className="brut-btn-primary">{m.isPending ? 'Scheduling…' : 'Schedule inspection'}</button>
          </div>
          <p className="mono-eyebrow pt-2">Checklist template auto-selected based on property type ({property?.type ?? '—'}).</p>
        </form>
      </PageBody>
    </>
  );
}
