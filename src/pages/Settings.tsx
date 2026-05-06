import { PageBody, PageHeader } from '@/components/Page';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { resetDb } from '@/lib/api';
import { SEED_USERS } from '@/lib/seed';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function Settings() {
  const { user, switchRole } = useAuth();
  const { theme, toggle } = useTheme();
  const qc = useQueryClient();

  return (
    <>
      <PageHeader eyebrow="account" title="Settings" />
      <PageBody className="space-y-6 max-w-2xl">
        <section className="brut-card p-5">
          <p className="mono-eyebrow mb-2">// profile</p>
          <p className="font-mono"><span className="font-bold">{user?.name}</span> · {user?.email}</p>
          <p className="font-mono text-xs mt-1">role: {user?.role}</p>
        </section>

        <section className="brut-card p-5">
          <p className="mono-eyebrow mb-3">// theme</p>
          <button onClick={toggle} className="brut-btn">{theme === 'dark' ? 'Switch to light' : 'Switch to dark'}</button>
        </section>

        <section className="brut-card p-5">
          <p className="mono-eyebrow mb-3">// demo: switch role</p>
          <p className="text-sm mb-3 text-ink/70 dark:text-paper/70">Jump between seeded accounts to see the app from different roles.</p>
          <div className="grid grid-cols-2 gap-2">
            {SEED_USERS.map(u => (
              <button key={u.uid} onClick={() => { switchRole(u.uid); toast.success(`Switched to ${u.name}`); }}
                className="border-2 border-ink dark:border-paper px-2 py-2 text-left hover:bg-hazard hover:text-ink">
                <div className="font-mono text-xs font-bold">{u.role}</div>
                <div className="font-mono text-2xs">{u.name}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="brut-card p-5 border-warn">
          <p className="mono-eyebrow mb-3 !text-warn">// danger zone</p>
          <p className="text-sm mb-3">Reset all local demo data back to seeded fixtures.</p>
          <button onClick={() => { resetDb(); qc.invalidateQueries(); toast.success('Demo data reset'); }} className="brut-btn-danger">Reset demo data</button>
        </section>
      </PageBody>
    </>
  );
}
