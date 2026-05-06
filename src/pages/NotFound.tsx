import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="max-w-2xl">
        <div className="font-mono text-[20vw] sm:text-[14rem] leading-none font-extrabold tracking-tighter">
          4<span className="bg-hazard text-ink px-2">0</span>4
        </div>
        <p className="mono-eyebrow mt-2 mb-4">// route does not exist</p>
        <h1 className="font-mono text-3xl font-extrabold tracking-tighter mb-3">No inspection here.</h1>
        <p className="text-sm mb-6">The page you tried to load isn't on the schedule. Head back to the dashboard.</p>
        <div className="flex gap-2">
          <Link to="/app" className="brut-btn-primary">Dashboard</Link>
          <Link to="/" className="brut-btn">Marketing site</Link>
        </div>
      </div>
    </div>
  );
}
