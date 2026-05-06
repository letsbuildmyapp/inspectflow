import { Link } from 'react-router-dom';

export function ServerError() {
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-warn text-paper">
      <div className="max-w-2xl">
        <div className="font-mono text-[20vw] sm:text-[14rem] leading-none font-extrabold tracking-tighter">5<span className="bg-ink text-paper px-2">0</span>0</div>
        <p className="mono-eyebrow mt-2 mb-4 !text-paper/80">// server fault</p>
        <h1 className="font-mono text-3xl font-extrabold tracking-tighter mb-3">Something fell off the wall.</h1>
        <p className="text-sm mb-6">An unexpected error occurred. Try the dashboard, or wait a minute and reload.</p>
        <Link to="/app" className="brut-btn !bg-ink !text-paper">Dashboard</Link>
      </div>
    </div>
  );
}
