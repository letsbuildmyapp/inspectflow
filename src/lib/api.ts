// Unified data API. By default uses a localStorage-backed mock store so the
// app is fully functional without any Firebase project. Set VITE_USE_MOCK=false
// + VITE_USE_EMULATOR=true to point at the Firebase emulator suite instead.
//
// The mock simulates async (50-150ms) so loading states are exercised.
import { SEED_PROPERTIES, SEED_UNITS, SEED_INSPECTIONS, SEED_TICKETS, SEED_USERS } from './seed';
import type { Property, Unit, Inspection, Ticket, UserDoc, InspectionItem, ItemStatus } from '@/types';

const KEY = 'inspectflow.v1';

interface DB {
  users: UserDoc[];
  properties: Property[];
  units: Unit[];
  inspections: Inspection[];
  tickets: Ticket[];
}

function load(): DB {
  if (typeof window === 'undefined') return seed();
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const fresh = seed();
    save(fresh);
    return fresh;
  }
  try {
    return JSON.parse(raw) as DB;
  } catch {
    const fresh = seed();
    save(fresh);
    return fresh;
  }
}

function save(db: DB) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify(db));
  }
}

function seed(): DB {
  return {
    users: [...SEED_USERS],
    properties: [...SEED_PROPERTIES],
    units: [...SEED_UNITS],
    inspections: [...SEED_INSPECTIONS],
    tickets: [...SEED_TICKETS],
  };
}

export function resetDb() {
  const fresh = seed();
  save(fresh);
  return fresh;
}

const delay = (ms = 80) => new Promise(res => setTimeout(res, ms));
const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

// ---- Properties ----
export async function listProperties(): Promise<Property[]> {
  await delay();
  return load().properties.sort((a, b) => a.name.localeCompare(b.name));
}
export async function getProperty(id: string): Promise<Property | null> {
  await delay();
  return load().properties.find(p => p.id === id) ?? null;
}
export async function createProperty(input: Omit<Property, 'id' | 'createdAt' | 'unitCount'>): Promise<Property> {
  await delay();
  const db = load();
  const p: Property = { ...input, id: uid('p'), createdAt: Date.now(), unitCount: 0 };
  db.properties.push(p); save(db);
  return p;
}
export async function updateProperty(id: string, patch: Partial<Property>): Promise<Property> {
  await delay();
  const db = load();
  const idx = db.properties.findIndex(p => p.id === id);
  if (idx < 0) throw new Error('not found');
  db.properties[idx] = { ...db.properties[idx], ...patch };
  save(db);
  return db.properties[idx];
}
export async function deleteProperty(id: string): Promise<void> {
  await delay();
  const db = load();
  db.properties = db.properties.filter(p => p.id !== id);
  db.units = db.units.filter(u => u.propertyId !== id);
  save(db);
}

// ---- Units ----
export async function listUnits(propertyId?: string): Promise<Unit[]> {
  await delay();
  const all = load().units;
  return propertyId ? all.filter(u => u.propertyId === propertyId) : all;
}
export async function getUnit(id: string): Promise<Unit | null> {
  await delay();
  return load().units.find(u => u.id === id) ?? null;
}
export async function createUnit(input: Omit<Unit, 'id' | 'createdAt'>): Promise<Unit> {
  await delay();
  const db = load();
  const u: Unit = { ...input, id: uid('u'), createdAt: Date.now() };
  db.units.push(u);
  const prop = db.properties.find(p => p.id === u.propertyId);
  if (prop) prop.unitCount = db.units.filter(x => x.propertyId === prop.id).length;
  save(db);
  return u;
}
export async function updateUnit(id: string, patch: Partial<Unit>): Promise<Unit> {
  await delay();
  const db = load();
  const idx = db.units.findIndex(u => u.id === id);
  if (idx < 0) throw new Error('not found');
  db.units[idx] = { ...db.units[idx], ...patch };
  save(db);
  return db.units[idx];
}
export async function deleteUnit(id: string): Promise<void> {
  await delay();
  const db = load();
  const u = db.units.find(x => x.id === id);
  db.units = db.units.filter(x => x.id !== id);
  if (u) {
    const prop = db.properties.find(p => p.id === u.propertyId);
    if (prop) prop.unitCount = db.units.filter(x => x.propertyId === prop.id).length;
  }
  save(db);
}

// ---- Inspections ----
export async function listInspections(filter?: { propertyId?: string; status?: Inspection['status']; inspectorId?: string }): Promise<Inspection[]> {
  await delay();
  let list = load().inspections;
  if (filter?.propertyId) list = list.filter(i => i.propertyId === filter.propertyId);
  if (filter?.status) list = list.filter(i => i.status === filter.status);
  if (filter?.inspectorId) list = list.filter(i => i.inspectorId === filter.inspectorId);
  return list.sort((a, b) => b.scheduledFor - a.scheduledFor);
}
export async function getInspection(id: string): Promise<Inspection | null> {
  await delay();
  return load().inspections.find(i => i.id === id) ?? null;
}
export async function createInspection(input: Omit<Inspection, 'id' | 'createdAt' | 'status' | 'items'> & { template: 'residential' | 'commercial' }): Promise<Inspection> {
  await delay();
  const db = load();
  const { template, ...rest } = input;
  const items = (template === 'commercial' ? COM : RES).map((t, idx) => ({
    id: `it_${Date.now()}_${idx}`,
    category: t.category, label: t.label,
    status: 'pending' as ItemStatus, photos: [],
  }));
  const ins: Inspection = { ...rest, id: uid('i'), createdAt: Date.now(), status: 'scheduled', items };
  db.inspections.push(ins); save(db);
  return ins;
}
export async function updateInspection(id: string, patch: Partial<Inspection>): Promise<Inspection> {
  await delay();
  const db = load();
  const idx = db.inspections.findIndex(i => i.id === id);
  if (idx < 0) throw new Error('not found');
  db.inspections[idx] = { ...db.inspections[idx], ...patch };
  save(db);
  return db.inspections[idx];
}
export async function updateInspectionItem(inspectionId: string, itemId: string, patch: Partial<InspectionItem>): Promise<Inspection> {
  await delay(40);
  const db = load();
  const ins = db.inspections.find(i => i.id === inspectionId);
  if (!ins) throw new Error('not found');
  const item = ins.items.find(it => it.id === itemId);
  if (!item) throw new Error('item not found');
  Object.assign(item, patch);
  if (ins.status === 'scheduled') ins.status = 'in_progress';
  if (!ins.startedAt) ins.startedAt = Date.now();
  save(db);
  return ins;
}

// ---- Tickets ----
export async function listTickets(filter?: { status?: Ticket['status']; propertyId?: string; assigneeId?: string }): Promise<Ticket[]> {
  await delay();
  let list = load().tickets;
  if (filter?.status) list = list.filter(t => t.status === filter.status);
  if (filter?.propertyId) list = list.filter(t => t.propertyId === filter.propertyId);
  if (filter?.assigneeId) list = list.filter(t => t.assigneeId === filter.assigneeId);
  return list.sort((a, b) => b.createdAt - a.createdAt);
}
export async function getTicket(id: string): Promise<Ticket | null> {
  await delay();
  return load().tickets.find(t => t.id === id) ?? null;
}
export async function createTicket(input: Omit<Ticket, 'id' | 'createdAt' | 'status'> & { status?: Ticket['status'] }): Promise<Ticket> {
  await delay();
  const db = load();
  const t: Ticket = { ...input, id: uid('t'), createdAt: Date.now(), status: input.status ?? 'open' };
  db.tickets.push(t); save(db);
  return t;
}
export async function updateTicket(id: string, patch: Partial<Ticket>): Promise<Ticket> {
  await delay();
  const db = load();
  const idx = db.tickets.findIndex(t => t.id === id);
  if (idx < 0) throw new Error('not found');
  db.tickets[idx] = { ...db.tickets[idx], ...patch };
  if (patch.status === 'resolved' && !db.tickets[idx].resolvedAt) {
    db.tickets[idx].resolvedAt = Date.now();
  }
  save(db);
  return db.tickets[idx];
}

// ---- Users ----
export async function listUsers(): Promise<UserDoc[]> {
  await delay();
  return load().users;
}

// ---- AI Condition Summary ----
// Calls the Cloud Function if Firebase is configured + reachable, otherwise falls
// back to a deterministic fixture summary derived from the inspection data so
// the demo always produces useful output. This mirrors the same fallback the
// Cloud Function uses when ANTHROPIC_API_KEY is unset.
export async function generateAiSummary(inspectionId: string): Promise<string> {
  const ins = await getInspection(inspectionId);
  if (!ins) throw new Error('inspection not found');

  // Try Cloud Function first
  try {
    if (import.meta.env.VITE_USE_EMULATOR === 'true' || import.meta.env.VITE_FUNCTIONS_URL) {
      const url = import.meta.env.VITE_FUNCTIONS_URL
        ? `${import.meta.env.VITE_FUNCTIONS_URL}/generateConditionSummary`
        : `http://127.0.0.1:5001/${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'inspectflow-demo'}/us-central1/generateConditionSummary`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ inspectionId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          await updateInspection(inspectionId, { aiSummary: data.summary, aiSummaryCachedAt: Date.now() });
          return data.summary;
        }
      }
    }
  } catch (e) {
    console.warn('Cloud function unreachable, using fixture summary', e);
  }

  // Fixture fallback
  await delay(900);
  const summary = buildFixtureSummary(ins);
  await updateInspection(inspectionId, { aiSummary: summary, aiSummaryCachedAt: Date.now() });
  return summary;
}

function buildFixtureSummary(ins: Inspection): string {
  const fails = ins.items.filter(i => i.status === 'fail');
  const passes = ins.items.filter(i => i.status === 'pass').length;
  const total = ins.items.length;
  if (fails.length === 0) {
    return `${ins.unitLabel} at ${ins.propertyName} passed inspection cleanly: ${passes}/${total} items pass, no failures recorded. Property is in serviceable condition with no immediate maintenance escalations. Recommend routine recheck on next quarterly cycle.`;
  }
  const high = fails.filter(f => f.severity === 'high').length;
  const safetyKw = fails.find(f => /smoke|co|fire|electrical|panel|outlet/i.test(f.label));
  const plumbing = fails.filter(f => /sink|toilet|leak|drain|shower|tub|caulk|grout/i.test(f.label));
  const lines: string[] = [];
  lines.push(`${ins.unitLabel} at ${ins.propertyName} is in ${high > 0 ? 'flagged' : 'serviceable but flagged'} condition with ${fails.length} of ${total} checklist items failing.`);
  if (safetyKw) lines.push(`Life-safety attention required: ${safetyKw.label.toLowerCase()}.`);
  if (plumbing.length >= 2) lines.push(`Multiple plumbing failures (${plumbing.length}) suggest sub-floor moisture risk; triage together rather than as separate tickets.`);
  lines.push(`Failing items: ${fails.map(f => f.label).join('; ')}.`);
  lines.push(`Recommend opening ${fails.length} maintenance ticket${fails.length === 1 ? '' : 's'} and reinspecting within 14 days.`);
  return lines.join(' ');
}

// Inline checklist templates (mirror seed.ts so new inspections work standalone)
const RES = [
  { category: 'Entry', label: 'Front door operates and locks securely' },
  { category: 'Entry', label: 'Smoke + CO detector functional, batteries fresh' },
  { category: 'Living Area', label: 'Walls, ceiling, baseboards in good repair' },
  { category: 'Living Area', label: 'Windows open, close, and lock' },
  { category: 'Living Area', label: 'HVAC vents clean, thermostat operable' },
  { category: 'Kitchen', label: 'Sink fixtures operate, no leaks under cabinet' },
  { category: 'Kitchen', label: 'Refrigerator + freezer cooling correctly' },
  { category: 'Kitchen', label: 'Stove burners + oven heat to set temperature' },
  { category: 'Kitchen', label: 'Garbage disposal operates without grinding' },
  { category: 'Bathroom', label: 'Toilet flushes, no running, no rocking' },
  { category: 'Bathroom', label: 'Shower/tub drains within 30s, no standing water' },
  { category: 'Bathroom', label: 'Exhaust fan operates' },
  { category: 'Bathroom', label: 'Caulking + grout intact, no mold visible' },
  { category: 'Bedroom', label: 'Closet doors operable, hardware intact' },
  { category: 'Bedroom', label: 'Outlets test live; no scorch marks' },
  { category: 'Exterior', label: 'No exterior water intrusion at windows or roof line' },
];
const COM = [
  { category: 'Loading Dock', label: 'Bay door operates, weather seal intact' },
  { category: 'Loading Dock', label: 'Dock leveler functional, safety chocks present' },
  { category: 'Floor', label: 'Concrete floor crack-free in main bay' },
  { category: 'Floor', label: 'Floor markings + safety lines visible' },
  { category: 'Electrical', label: 'Panel labeled, no exposed wiring' },
  { category: 'Electrical', label: 'Emergency lighting tests and holds 90s' },
  { category: 'Plumbing', label: 'Restroom fixtures operate, no leaks' },
  { category: 'HVAC', label: 'Rooftop unit serviced within 12 months' },
  { category: 'Safety', label: 'Fire extinguishers tagged within 12 months' },
  { category: 'Safety', label: 'Sprinkler heads clear, no obstructions within 18"' },
  { category: 'Exterior', label: 'Roof drains + gutters clear of debris' },
  { category: 'Exterior', label: 'Parking lot striping + ADA spaces compliant' },
];
