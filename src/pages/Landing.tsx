import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, Building2, Wrench, FileText, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function Landing() {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-3 border-ink dark:border-paper px-4 lg:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-hazard border-3 border-ink dark:border-paper grid place-items-center font-mono font-extrabold">IF</div>
          <span className="font-mono font-bold tracking-tight">INSPECT/FLOW</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="brut-icon-btn" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link to="/login" className="brut-btn-primary">Sign in <ArrowRight size={14} /></Link>
        </div>
      </header>

      <section className="px-4 lg:px-8 py-16 lg:py-24 border-b-3 border-ink dark:border-paper">
        <div className="max-w-5xl">
          <p className="mono-eyebrow mb-6">// production-grade inspection ops</p>
          <h1 className="font-mono font-extrabold tracking-tighter text-5xl sm:text-7xl lg:text-8xl leading-[0.9]">
            Property<br />
            inspections,<br />
            made <span className="bg-hazard text-ink px-3 inline-block leading-[0.85]">operational</span>.
          </h1>
          <p className="max-w-2xl mt-8 text-lg sm:text-xl font-sans">
            Walk the unit. Mark items pass or fail. Snap photos. Generate an AI condition summary and a maintenance ticket queue — before you leave the parking lot.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/login" className="brut-btn-primary text-base !px-6 !py-3">Open the demo <ArrowRight size={16} /></Link>
            <a href="#features" className="brut-btn text-base !px-6 !py-3">What it does</a>
          </div>
          <div className="mt-12 flex flex-wrap gap-4 mono-eyebrow">
            <span>Built for: residential PM teams · facility ops · property managers running &gt;50 units</span>
          </div>
        </div>
      </section>

      <section id="features" className="px-4 lg:px-8 py-16 border-b-3 border-ink dark:border-paper">
        <p className="mono-eyebrow mb-4">// the loop</p>
        <h2 className="font-mono text-3xl sm:text-5xl font-extrabold tracking-tighter mb-10">Inspect → Report → Repair.</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 border-3 border-ink dark:border-paper">
          {[
            { icon: Building2, title: 'Properties', body: 'Hierarchical model. Properties contain units, units contain inspections.' },
            { icon: ClipboardCheck, title: 'Walking checklist', body: 'Mobile-first. Designed to be used in a hallway with one hand and gloves on.' },
            { icon: FileText, title: 'AI condition summary', body: 'Reads your notes and photos, writes the report copy. Edit in place, ship in minutes.' },
            { icon: Wrench, title: 'Auto tickets', body: 'Failed item → maintenance ticket → assigned → resolved. No double entry.' },
          ].map((f, i) => (
            <div key={i} className={'p-6 ' + (i < 3 ? 'border-r-0 lg:border-r-3 border-ink dark:border-paper ' : '') + 'border-b-3 lg:border-b-0 border-ink dark:border-paper last:border-b-0'}>
              <f.icon size={28} className="mb-3" />
              <h3 className="font-mono font-bold uppercase tracking-wider mb-2">{f.title}</h3>
              <p className="text-base text-ink/80 dark:text-paper/80">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-4 lg:px-8 py-6 mt-auto flex items-center justify-between font-mono text-xs">
        <span>© INSPECT/FLOW</span>
        <span>a letsbuildmyapp.com showcase</span>
      </footer>
    </div>
  );
}
