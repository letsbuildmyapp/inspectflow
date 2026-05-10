import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { ArrowRight, Loader2, ShieldCheck, Hammer, ClipboardList } from 'lucide-react';
import { SEED_USERS } from '@/lib/seed';

const DEMO_PASSWORD = 'demo1234';

const ROLE_META: Record<string, { icon: any; color: string; description: string }> = {
  admin: { icon: ShieldCheck, color: 'from-indigo-500 to-violet-500', description: 'Full platform access' },
  inspector: { icon: Hammer, color: 'from-amber-500 to-orange-500', description: 'Field inspections + reports' },
  manager: { icon: ClipboardList, color: 'from-emerald-500 to-teal-500', description: 'Property + ticket oversight' },
};

export function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Signed in');
      nav('/app');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onDemoLogin(uid: string) {
    const u = SEED_USERS.find((x) => x.uid === uid);
    if (!u) return;
    setEmail(u.email);
    setPassword(DEMO_PASSWORD);
    setDemoLoading(uid);
    try {
      await signIn(u.email, DEMO_PASSWORD);
      toast.success(`Signed in as ${u.role}`);
      nav('/app');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDemoLoading(null);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-paper text-ink">

      <main className="relative z-10 flex flex-1 items-start justify-center px-6 pt-8 sm:pt-12 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-[440px]"
        >
          <div className="brut-card p-8 shadow-2xl">
            <div className="space-y-1.5">
              <p className="mono-eyebrow">// auth</p>
              <h1 className="font-mono text-2xl font-extrabold tracking-tighter">Sign in to InspectFlow</h1>
            </div>

            <div className="my-6 grid gap-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="mono-eyebrow">// one-click demo logins</span>
                <span className="font-mono text-[10px] text-ink/60">no password needed</span>
              </div>
              {SEED_USERS.map((u) => {
                const meta = ROLE_META[u.role] ?? ROLE_META.admin;
                const Icon = meta.icon;
                return (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => onDemoLogin(u.uid)}
                    disabled={demoLoading !== null || loading}
                    className="group flex items-center gap-3 border-2 border-ink p-3 text-left transition-colors hover:bg-hazard disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center bg-gradient-to-br ${meta.color} text-white shadow-sm`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-sm font-bold capitalize">{u.role}</div>
                      <div className="font-mono text-xs truncate opacity-70">{u.name} · {u.email}</div>
                    </div>
                    {demoLoading === u.uid ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-[3px] bg-ink" />
              <span className="mono-eyebrow">or sign in with email</span>
              <div className="flex-1 h-[3px] bg-ink" />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="brut-label">Email</label>
                <input className="brut-input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@inspectflow.demo" />
              </div>
              <div>
                <label className="brut-label">Password</label>
                <input className="brut-input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading} className="brut-btn-primary w-full !py-3">
                {loading ? <Loader2 className="size-4 animate-spin" /> : (<>Sign in <ArrowRight size={14} /></>)}
              </button>
            </form>
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 px-6 pb-8 text-center font-mono text-xs sm:px-10">
        <a href="https://letsbuildmyapp.com" target="_blank" rel="noreferrer" className="text-ink underline-offset-4 hover:underline">
          Let&apos;s Build My App
        </a>
      </footer>
    </div>
  );
}
