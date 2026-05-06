import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listInspections, listProperties, listTickets } from '@/lib/api';
import { PageBody, PageHeader, Loading } from '@/components/Page';
import { useAuth } from '@/lib/auth';
import { ArrowRight, Building2, ClipboardCheck, Wrench, FileText } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import { StatusBadge, PriorityBadge } from '@/components/Badges';

export function Dashboard() {
  const { user } = useAuth();
  const props = useQuery({ queryKey: ['properties'], queryFn: listProperties });
  const insps = useQuery({ queryKey: ['inspections'], queryFn: () => listInspections() });
  const tickets = useQuery({ queryKey: ['tickets'], queryFn: () => listTickets() });

  const loading = props.isLoading || insps.isLoading || tickets.isLoading;

  const open = tickets.data?.filter(t => t.status !== 'resolved') ?? [];
  const upcoming = insps.data?.filter(i => i.status === 'scheduled').slice(0, 3) ?? [];
  const inProgress = insps.data?.filter(i => i.status === 'in_progress') ?? [];
  const completed = insps.data?.filter(i => i.status === 'completed').slice(0, 3) ?? [];

  return (
    <>
      <PageHeader
        eyebrow={`Welcome back, ${user?.name?.split(' ')[0] ?? ''}`}
        title="Operations dashboard"
        action={<Link to="/app/inspections/new" className="brut-btn-primary">New inspection <ArrowRight size={14} /></Link>}
      >
        <p className="mono-eyebrow mt-2">{formatDate(new Date())}</p>
      </PageHeader>

      <PageBody>
        {loading && <Loading />}
        {!loading && (
          <>
            <div data-tour="stats-grid" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Stat icon={Building2} label="Properties" value={props.data?.length ?? 0} to="/app/properties" />
              <Stat icon={ClipboardCheck} label="In progress" value={inProgress.length} to="/app/inspections" />
              <Stat icon={FileText} label="Scheduled" value={upcoming.length} to="/app/inspections" />
              <Stat icon={Wrench} label="Open tickets" value={open.length} to="/app/tickets" hot={open.length > 0} />
            </div>

            <div data-tour="dashboard-lists" className="grid lg:grid-cols-2 gap-6">
              <section className="brut-card">
                <header className="px-4 py-3 border-b-3 border-ink dark:border-paper flex items-center justify-between">
                  <h2 className="font-mono font-bold uppercase tracking-wider">In progress</h2>
                  <Link to="/app/inspections" className="mono-eyebrow hover:text-hazard">view all →</Link>
                </header>
                {inProgress.length === 0 ? (
                  <div className="p-6 text-sm text-ink/60 dark:text-paper/60 font-mono">none right now.</div>
                ) : (
                  <ul>
                    {inProgress.map(i => (
                      <li key={i.id} className="border-b-3 border-ink dark:border-paper last:border-b-0">
                        <Link to={`/app/inspections/${i.id}/run`} className="block px-4 py-3 hover:bg-hazard/20">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="font-mono font-bold">{i.unitLabel} · {i.propertyName}</div>
                              <div className="mono-eyebrow mt-1">started {formatDateTime(i.startedAt)} · {i.inspectorName}</div>
                            </div>
                            <StatusBadge status={i.status} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="brut-card">
                <header className="px-4 py-3 border-b-3 border-ink dark:border-paper flex items-center justify-between">
                  <h2 className="font-mono font-bold uppercase tracking-wider">Open tickets</h2>
                  <Link to="/app/tickets" className="mono-eyebrow hover:text-hazard">view all →</Link>
                </header>
                {open.length === 0 ? (
                  <div className="p-6 text-sm text-ink/60 dark:text-paper/60 font-mono">no open tickets. nice.</div>
                ) : (
                  <ul>
                    {open.slice(0, 5).map(t => (
                      <li key={t.id} className="border-b-3 border-ink dark:border-paper last:border-b-0">
                        <Link to={`/app/tickets/${t.id}`} className="block px-4 py-3 hover:bg-hazard/20">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="font-mono font-bold">{t.title}</div>
                              <div className="mono-eyebrow mt-1">{t.unitLabel} · {t.propertyName}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <PriorityBadge priority={t.priority} />
                              <StatusBadge status={t.status} />
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="brut-card">
                <header className="px-4 py-3 border-b-3 border-ink dark:border-paper">
                  <h2 className="font-mono font-bold uppercase tracking-wider">Scheduled next</h2>
                </header>
                {upcoming.length === 0 ? (
                  <div className="p-6 text-sm text-ink/60 dark:text-paper/60 font-mono">queue empty.</div>
                ) : (
                  <ul>
                    {upcoming.map(i => (
                      <li key={i.id} className="border-b-3 border-ink dark:border-paper last:border-b-0">
                        <Link to={`/app/inspections/${i.id}`} className="block px-4 py-3 hover:bg-hazard/20">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="font-mono font-bold">{i.unitLabel} · {i.propertyName}</div>
                              <div className="mono-eyebrow mt-1">{formatDateTime(i.scheduledFor)} · {i.inspectorName}</div>
                            </div>
                            <StatusBadge status={i.status} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="brut-card">
                <header className="px-4 py-3 border-b-3 border-ink dark:border-paper">
                  <h2 className="font-mono font-bold uppercase tracking-wider">Recent reports</h2>
                </header>
                {completed.length === 0 ? (
                  <div className="p-6 text-sm text-ink/60 dark:text-paper/60 font-mono">no reports yet.</div>
                ) : (
                  <ul>
                    {completed.map(i => (
                      <li key={i.id} className="border-b-3 border-ink dark:border-paper last:border-b-0">
                        <Link to={`/app/inspections/${i.id}`} className="block px-4 py-3 hover:bg-hazard/20">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="font-mono font-bold">{i.unitLabel} · {i.propertyName}</div>
                              <div className="mono-eyebrow mt-1">completed {formatDate(i.completedAt)}</div>
                            </div>
                            <StatusBadge status={i.status} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </PageBody>
    </>
  );
}

function Stat({ icon: Icon, label, value, to, hot }: { icon: any; label: string; value: number; to: string; hot?: boolean }) {
  return (
    <Link to={to} className={'brut-card p-5 block hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutLg transition-all ' + (hot ? 'bg-hazard !text-ink' : '')}>
      <div className="flex items-start justify-between">
        <Icon size={22} />
        <span className="mono-eyebrow">{label}</span>
      </div>
      <div className="font-mono text-5xl font-extrabold mt-4 tracking-tighter">{value}</div>
    </Link>
  );
}
