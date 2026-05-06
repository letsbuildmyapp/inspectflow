// Auth provider. Defaults to mock auth (so demo runs offline). When
// VITE_USE_EMULATOR=true, swaps to Firebase Auth against the emulator.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { SEED_USERS } from './seed';
import type { UserDoc, Role } from '@/types';

const KEY = 'inspectflow.auth.v1';

interface AuthCtx {
  user: UserDoc | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserDoc>;
  signInGoogle: () => Promise<UserDoc>;
  signUp: (email: string, name: string, password: string, role: Role) => Promise<UserDoc>;
  signOut: () => Promise<void>;
  switchRole: (uid: string) => void; // demo helper
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* noop */ }
    }
    setLoading(false);
  }, []);

  const persist = (u: UserDoc | null) => {
    if (u) localStorage.setItem(KEY, JSON.stringify(u));
    else localStorage.removeItem(KEY);
    setUser(u);
  };

  async function signIn(email: string, _password: string): Promise<UserDoc> {
    await new Promise(r => setTimeout(r, 300));
    const u = SEED_USERS.find(x => x.email.toLowerCase() === email.toLowerCase());
    if (!u) throw new Error('No account for that email. Try admin@inspectflow.demo, marco@inspectflow.demo, priya@inspectflow.demo, or jordan@inspectflow.demo.');
    persist(u);
    return u;
  }
  async function signInGoogle(): Promise<UserDoc> {
    await new Promise(r => setTimeout(r, 400));
    const u = SEED_USERS[0];
    persist(u);
    return u;
  }
  async function signUp(email: string, name: string, _password: string, role: Role): Promise<UserDoc> {
    await new Promise(r => setTimeout(r, 400));
    const u: UserDoc = { uid: `u_${Math.random().toString(36).slice(2, 9)}`, email, name, role, createdAt: Date.now() };
    persist(u);
    return u;
  }
  async function signOut(): Promise<void> {
    await new Promise(r => setTimeout(r, 100));
    persist(null);
  }
  function switchRole(uid: string) {
    const u = SEED_USERS.find(x => x.uid === uid);
    if (u) persist(u);
  }

  return (
    <Ctx.Provider value={{ user, loading, signIn, signInGoogle, signUp, signOut, switchRole }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be inside AuthProvider');
  return v;
}
