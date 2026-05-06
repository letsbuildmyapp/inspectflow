import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Building2, ClipboardCheck, Wrench, Sun, Moon, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/properties', label: 'Properties', icon: Building2 },
  { to: '/app/inspections', label: 'Inspections', icon: ClipboardCheck },
  { to: '/app/tickets', label: 'Tickets', icon: Wrench },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  // Hide chrome on /run mobile inspector flow for focused experience
  const isRunFlow = /\/inspections\/[^/]+\/run/.test(loc.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b-3 border-ink dark:border-paper bg-paper dark:bg-coal sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden brut-icon-btn"
              onClick={() => setOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link to="/app" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-hazard border-3 border-ink dark:border-paper grid place-items-center font-mono font-extrabold">IF</div>
              <span className="font-mono font-bold tracking-tight hidden sm:inline">INSPECT/FLOW</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="brut-icon-btn" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/app/settings" className="brut-icon-btn" aria-label="Settings">
              <SettingsIcon size={16} />
            </Link>
            <div className="hidden md:flex flex-col items-end mr-2 leading-tight">
              <span className="font-mono text-xs font-bold">{user?.name}</span>
              <span className="mono-eyebrow">{user?.role}</span>
            </div>
            <button onClick={async () => { await signOut(); navigate('/login'); }} className="brut-btn !px-3 !py-2" aria-label="Sign out">
              <LogOut size={14} />
              <span className="hidden sm:inline">Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className={cn('flex-1 flex', isRunFlow && 'lg:[&>aside]:hidden')}>
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex w-60 shrink-0 border-r-3 border-ink dark:border-paper flex-col bg-paper dark:bg-coal">
          <nav data-tour="sidebar-nav" className="p-4 flex flex-col gap-2">
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2 border-3 border-transparent font-mono text-sm uppercase tracking-wider',
                  isActive
                    ? 'border-ink dark:border-paper bg-hazard text-ink shadow-brut'
                    : 'hover:border-ink dark:hover:border-paper hover:translate-x-[-1px] hover:translate-y-[-1px]'
                )}
              >
                <n.icon size={16} />
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto p-4 border-t-3 border-ink dark:border-paper">
            <p className="mono-eyebrow mb-1">Active user</p>
            <p className="font-mono text-sm font-bold">{user?.name}</p>
            <p className="font-mono text-2xs text-ink/60 dark:text-paper/60 mt-1">role: {user?.role}</p>
          </div>
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="lg:hidden fixed inset-0 z-30 bg-ink/40" onClick={() => setOpen(false)}>
            <aside
              className="absolute left-0 top-[57px] bottom-0 w-64 bg-paper dark:bg-coal border-r-3 border-ink dark:border-paper p-4 flex flex-col gap-2"
              onClick={e => e.stopPropagation()}
            >
              {NAV.map(n => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-3 py-2 border-3 font-mono text-sm uppercase',
                    isActive ? 'border-ink dark:border-paper bg-hazard text-ink' : 'border-transparent'
                  )}
                >
                  <n.icon size={16} />
                  {n.label}
                </NavLink>
              ))}
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
