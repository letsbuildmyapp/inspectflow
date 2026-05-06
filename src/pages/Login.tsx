import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { SEED_USERS } from '@/lib/seed';

export function Login() {
  const { signIn, signInGoogle } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@inspectflow.demo');
  const [password, setPassword] = useState('demo1234');
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await signIn(email, password);
      toast.success('Signed in');
      nav('/app');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function googleIn() {
    setPending(true);
    try { await signInGoogle(); nav('/app'); } finally { setPending(false); }
  }

  async function quick(uid: string) {
    const u = SEED_USERS.find(x => x.uid === uid);
    if (!u) return;
    setEmail(u.email);
    setPassword('demo1234');
    setPending(true);
    try {
      await signIn(u.email, 'demo1234');
      toast.success(`Signed in as ${u.role}`);
      nav('/app');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-ink text-paper border-r-3 border-ink">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-hazard border-3 border-paper grid place-items-center font-mono font-extrabold text-ink">IF</div>
          <span className="font-mono font-bold tracking-tight">INSPECT/FLOW</span>
        </Link>
        <div>
          <p className="mono-eyebrow !text-paper/60 mb-4">// today</p>
          <h2 className="font-mono text-4xl font-extrabold tracking-tighter leading-tight">
            Three inspections.<br />Two open tickets.<br /><span className="bg-hazard text-ink px-2">One report</span> ready to ship.
          </h2>
        </div>
        <p className="font-mono text-xs">demo build · seeded · safe to break</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-hazard border-3 border-ink grid place-items-center font-mono font-extrabold">IF</div>
            <span className="font-mono font-bold">INSPECT/FLOW</span>
          </Link>
          <p className="mono-eyebrow mb-2">// auth</p>
          <h1 className="font-mono text-3xl font-extrabold tracking-tighter mb-6">Sign in.</h1>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="brut-label">Email</label>
              <input className="brut-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="brut-label">Password</label>
              <input className="brut-input" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={pending} className="brut-btn-primary w-full !py-3">
              {pending ? 'Signing in…' : (<>Continue <ArrowRight size={14} /></>)}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-[3px] bg-ink dark:bg-paper" />
            <span className="mono-eyebrow">or</span>
            <div className="flex-1 h-[3px] bg-ink dark:bg-paper" />
          </div>

          <button onClick={googleIn} className="brut-btn w-full !py-3">Continue with Google</button>

          <div className="mt-8 brut-card p-4">
            <p className="mono-eyebrow mb-2">// demo accounts</p>
            <p className="text-sm mb-3">One-click sign-in.</p>
            <div className="grid grid-cols-2 gap-2">
              {SEED_USERS.map(u => (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => quick(u.uid)}
                  disabled={pending}
                  className="border-2 border-ink dark:border-paper px-3 py-2 text-left hover:bg-hazard hover:text-ink transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <div className="font-mono text-xs font-bold">{u.role}</div>
                  <div className="font-mono text-xs truncate opacity-80">{u.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
