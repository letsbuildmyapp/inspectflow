import { useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Building2,
  ClipboardCheck,
  CheckSquare,
  Wrench,
  Smartphone,
  ListChecks,
  Flag,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const TUTORIAL_KEY_PREFIX = 'inspectflow:tutorial_seen:';
const MOBILE_BREAKPOINT = 768;

type Step = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  body: React.ReactNode;
  /** data-tour attribute on the target element. Omit for centered (welcome / final). */
  target?: string;
  /** Preferred placement of the tooltip relative to the target. */
  placement?: 'right' | 'left' | 'top' | 'bottom';
};

const ADMIN_STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Welcome to InspectFlow',
    body: 'A property inspection workspace built for ops teams. Quick 30-second tour of the admin view.',
  },
  {
    icon: Building2,
    title: 'Properties & units',
    body: (
      <>
        Manage your <span className="font-bold">portfolio</span> here — buildings on top, units nested underneath. Every inspection and ticket rolls up to a unit.
      </>
    ),
    target: 'sidebar-nav',
    placement: 'right',
  },
  {
    icon: ClipboardCheck,
    title: 'Operations dashboard',
    body: (
      <>
        Live counts of <span className="font-bold">in-progress inspections</span>, scheduled work, and open tickets — one click into anything that needs eyes.
      </>
    ),
    target: 'stats-grid',
    placement: 'bottom',
  },
  {
    icon: Flag,
    title: "You're set.",
    body: (
      <>
        Open a property, schedule an inspection, or assign a ticket. Built by{' '}
        <a href="https://letsbuildmyapp.com" className="underline decoration-hazard decoration-2 underline-offset-4">letsbuildmyapp.com</a>.
      </>
    ),
  },
];

const INSPECTOR_STEPS: Step[] = [
  {
    icon: Smartphone,
    title: 'Welcome, inspector',
    body: 'Mobile-first field view. Phone in one hand, clipboard in the other — except the clipboard is the phone.',
  },
  {
    icon: ListChecks,
    title: 'Inspection lifecycle',
    body: (
      <>
        Each inspection moves through <span className="font-bold">scheduled</span> → <span className="font-bold">in_progress</span> → <span className="font-bold">completed</span>. Tap one to start the walk.
      </>
    ),
    target: 'sidebar-nav',
    placement: 'right',
  },
  {
    icon: CheckSquare,
    title: 'Walking checklist',
    body: (
      <>
        Mark every item <span className="font-bold">pass</span>, <span className="font-bold">fail</span>, or <span className="font-bold">N/A</span>. Attach photos and notes inline. Progress saves as you go.
      </>
    ),
    target: 'inspection-filters',
    placement: 'bottom',
  },
  {
    icon: Wrench,
    title: 'Tickets from failures',
    body: 'Failed item? Spawn a ticket on the spot — priority, description, photos carry over so the manager has everything.',
    target: 'sidebar-nav',
    placement: 'right',
  },
  {
    icon: Flag,
    title: 'Go inspect.',
    body: 'When the last item is logged, the report PDF generates automatically. You ship and move to the next unit.',
  },
];

const MANAGER_STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Welcome, property manager',
    body: 'Your read-only window into the portfolio. Inspection reports, open tickets, and unit status — all here.',
  },
  {
    icon: Building2,
    title: 'Properties + open tickets',
    body: (
      <>
        Jump between <span className="font-bold">properties</span> and the <span className="font-bold">tickets</span> queue. Anything red is something a tenant or admin is waiting on.
      </>
    ),
    target: 'sidebar-nav',
    placement: 'right',
  },
  {
    icon: Flag,
    title: "You're set.",
    body: (
      <>
        Built by{' '}
        <a href="https://letsbuildmyapp.com" className="underline decoration-hazard decoration-2 underline-offset-4">letsbuildmyapp.com</a>.
      </>
    ),
  },
];

type Rect = { top: number; left: number; width: number; height: number };

export function Tutorial() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth < MOBILE_BREAKPOINT,
  );

  const role = user?.role;
  const STEPS = useMemo<Step[]>(() => {
    if (role === 'inspector') return INSPECTOR_STEPS;
    if (role === 'manager') return MANAGER_STEPS;
    return ADMIN_STEPS;
  }, [role]);

  // Reset to first step if the role changes mid-tour
  useEffect(() => { setStep(0); }, [STEPS]);

  // First-run check — per role, per device
  useEffect(() => {
    if (!role) { setOpen(false); return; }
    const seen = localStorage.getItem(TUTORIAL_KEY_PREFIX + role);
    setOpen(!seen);
    setStep(0);
  }, [role]);

  // Track viewport size
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const close = useCallback(() => {
    if (role) localStorage.setItem(TUTORIAL_KEY_PREFIX + role, '1');
    setOpen(false);
  }, [role]);

  const next = useCallback(() => {
    setStep((s) => {
      if (s < STEPS.length - 1) return s + 1;
      close();
      return s;
    });
  }, [close, STEPS.length]);

  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  // Keyboard
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close, next, back]);

  // Compute target rect for current step (desktop only)
  const currentStep = STEPS[step];
  const targetSel = currentStep?.target;

  useLayoutEffect(() => {
    if (!open || isMobile || !targetSel) {
      setRect(null);
      return;
    }
    const compute = () => {
      const el = document.querySelector(`[data-tour="${targetSel}"]`) as HTMLElement | null;
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    compute();
    const onResize = () => compute();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open, isMobile, targetSel, step]);

  if (!open || !currentStep) return null;

  // ---------- MOBILE or no-target step: centered modal ----------
  const hasTarget = !!rect && !!targetSel;
  if (isMobile || !hasTarget) {
    return <CenteredModal steps={STEPS} step={step} onClose={close} onNext={next} onBack={back} onJump={setStep} />;
  }

  // ---------- DESKTOP: spotlight ----------
  const Icon = currentStep.icon;
  const isLast = step === STEPS.length - 1;

  // Tooltip placement: pick a side, then clamp to viewport
  const PAD = 16;
  const TOOLTIP_W = 380;
  const TOOLTIP_H_EST = 320;
  let top = 0;
  let left = 0;
  if (rect) {
    const placement = currentStep.placement ?? 'right';
    if (placement === 'right') {
      left = rect.left + rect.width + PAD;
      top = rect.top;
      if (left + TOOLTIP_W > window.innerWidth - PAD) {
        left = rect.left;
        top = rect.top + rect.height + PAD;
      }
    } else if (placement === 'left') {
      left = rect.left - TOOLTIP_W - PAD;
      top = rect.top;
    } else if (placement === 'bottom') {
      left = rect.left;
      top = rect.top + rect.height + PAD;
    } else if (placement === 'top') {
      left = rect.left;
      top = rect.top - TOOLTIP_H_EST - PAD;
    }
    left = Math.min(Math.max(PAD, left), window.innerWidth - TOOLTIP_W - PAD);
    top = Math.min(Math.max(PAD, top), window.innerHeight - TOOLTIP_H_EST - PAD);
  }
  const tipStyle: React.CSSProperties = { top, left, width: TOOLTIP_W };

  return (
    <AnimatePresence>
      {/* Spotlight backdrop with cutout */}
      <motion.div
        key="spot-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
        onClick={close}
      >
        {hasTarget && rect ? (
          <motion.div
            initial={false}
            animate={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
            }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className="absolute pointer-events-none"
            style={{
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.78), 0 0 0 3px oklch(0.74 0.19 60)',
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-black/78" />
        )}
      </motion.div>

      {/* Tooltip card — brutalist, no card-level motion */}
      <div
        key={`tip-${step}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        className="fixed z-[101] bg-paper dark:bg-coal text-ink dark:text-paper border-3 border-ink dark:border-paper rounded-none"
        style={{ ...tipStyle, boxShadow: '6px 6px 0 0 oklch(0.74 0.19 60)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 h-11 border-b-3 border-ink dark:border-paper">
          <span className="font-mono text-xs uppercase tracking-[0.15em]">
            Tour <span className="text-hazardDeep">/</span> <span className="tabular-nums font-bold">{step + 1}</span> of <span className="tabular-nums font-bold">{STEPS.length}</span>
          </span>
          <button
            onClick={close}
            className="p-1.5 border-3 border-transparent hover:border-ink dark:hover:border-paper"
            aria-label="Close tour"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5">
          <div className="h-10 w-10 bg-hazard border-3 border-ink dark:border-paper grid place-items-center mb-4">
            <Icon size={18} className="text-ink" />
          </div>
          <h2 id="tutorial-title" className="font-mono uppercase tracking-wider text-xl font-extrabold leading-tight">
            {currentStep.title}
          </h2>
          <div className="text-sm mt-3 leading-relaxed">{currentStep.body}</div>
        </div>

        <div className="flex items-center justify-between px-4 h-12 border-t-3 border-ink dark:border-paper">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                className={
                  i === step
                    ? 'h-2 w-6 bg-hazard border-2 border-ink dark:border-paper'
                    : 'h-2 w-2 bg-paper dark:bg-coal border-2 border-ink dark:border-paper hover:bg-hazard/40'
                }
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <button
                onClick={back}
                className="inline-flex items-center gap-1 h-8 px-2.5 font-mono text-xs uppercase tracking-wider hover:bg-hazard/20"
              >
                <ArrowLeft size={12} /> Back
              </button>
            ) : (
              <button
                onClick={close}
                className="inline-flex items-center h-8 px-2.5 font-mono text-xs uppercase tracking-wider hover:bg-hazard/20"
              >
                Skip
              </button>
            )}
            <button
              onClick={next}
              className="inline-flex items-center gap-1.5 h-8 px-3 font-mono text-xs uppercase tracking-wider font-bold bg-ink text-paper dark:bg-paper dark:text-ink border-3 border-ink dark:border-paper hover:bg-hazard hover:text-ink"
            >
              {isLast ? 'Done' : 'Next'} {!isLast ? <ArrowRight size={12} /> : null}
            </button>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}

// ---------- Centered modal (mobile + no-target desktop steps) ----------
function CenteredModal({
  steps, step, onClose, onNext, onBack, onJump,
}: {
  steps: Step[];
  step: number;
  onClose: () => void;
  onNext: () => void;
  onBack: () => void;
  onJump: (i: number) => void;
}) {
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] grid place-items-center px-4 py-8 bg-black/78 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md bg-paper dark:bg-coal text-ink dark:text-paper border-3 border-ink dark:border-paper rounded-none"
          style={{ boxShadow: '6px 6px 0 0 oklch(0.74 0.19 60)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 h-12 border-b-3 border-ink dark:border-paper">
            <span className="font-mono text-xs uppercase tracking-[0.15em]">
              Tour <span className="text-hazardDeep">/</span> <span className="tabular-nums font-bold">{step + 1}</span> of <span className="tabular-nums font-bold">{steps.length}</span>
            </span>
            <button onClick={onClose} className="p-1.5 border-3 border-transparent hover:border-ink dark:hover:border-paper" aria-label="Close tour">
              <X size={14} />
            </button>
          </div>
          <div className="p-6">
            <div className="h-12 w-12 bg-hazard border-3 border-ink dark:border-paper grid place-items-center mb-4">
              <Icon size={20} className="text-ink" />
            </div>
            <h2 className="font-mono uppercase tracking-wider text-2xl font-extrabold leading-tight">{current.title}</h2>
            <div className="text-base mt-3 leading-relaxed">{current.body}</div>
          </div>
          <div className="flex items-center justify-between px-4 h-14 border-t-3 border-ink dark:border-paper">
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => onJump(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className={
                    i === step
                      ? 'h-2 w-6 bg-hazard border-2 border-ink dark:border-paper'
                      : 'h-2 w-2 bg-paper dark:bg-coal border-2 border-ink dark:border-paper hover:bg-hazard/40'
                  }
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {step > 0 ? (
                <button onClick={onBack} className="inline-flex items-center gap-1 h-9 px-3 font-mono text-xs uppercase tracking-wider hover:bg-hazard/20">
                  <ArrowLeft size={13} /> Back
                </button>
              ) : (
                <button onClick={onClose} className="inline-flex items-center h-9 px-3 font-mono text-xs uppercase tracking-wider hover:bg-hazard/20">Skip</button>
              )}
              <button onClick={onNext} className="inline-flex items-center gap-1.5 h-9 px-4 font-mono text-xs uppercase tracking-wider font-bold bg-ink text-paper dark:bg-paper dark:text-ink border-3 border-ink dark:border-paper hover:bg-hazard hover:text-ink">
                {isLast ? 'Done' : 'Next'} {!isLast ? <ArrowRight size={13} /> : null}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
