import { useState, useEffect, useRef, useMemo } from 'react'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const EVENT_DATE = new Date('2026-08-05T04:00:00Z') // 5 Aug 2026 9:30 AM IST
const VENUE_SHORT = 'St. Peter\'s Engineering College, Hyderabad'
const VENUE_FULL = 'Main Seminar Hall, Block A, St. Peter\'s Engineering College, Hyderabad'

const DOMAINS = [
  'Healthcare',
  'Agriculture',
  'Education',
  'Cyber Security',
  'Smart Cities',
  'Finance',
  'Environment',
  'Tourism',
  "Women's Safety",
  'Transportation',
  'Retail',
  'Artificial Intelligence',
  'Mental Health',
  'Disaster Management',
  'Rural Development',
  'Accessibility',
  'Climate Change',
  'Waste Management',
  'Hospitality',
  'Sports Technology',
]

const WHEEL_LABELS = [
  'Healthcare',
  'Agriculture',
  'Education',
  'Cyber\nSecurity',
  'Smart\nCities',
  'Finance',
  'Environment',
  'Tourism',
  "Women's\nSafety",
  'Transport',
  'Retail',
  'AI',
  'Mental\nHealth',
  'Disaster\nMgmt',
  'Rural Dev',
  'Accessibility',
  'Climate\nChange',
  'Waste\nMgmt',
  'Hospitality',
  'Sports\nTech',
]

const TIMELINE = [
  {
    time: '09:30',
    period: 'AM',
    label: 'Registration & Reporting',
    note: 'Students report to the venue.\n\nActivities:\n• Registration Verification\n• Team Confirmation\n• ID Card Verification\n• Welcome Kit Distribution\n• Seating Arrangement\n• Background Music\n• Sponsor Displays',
  },
  {
    time: '09:50',
    period: 'AM',
    label: 'Entry Closure',
    note: 'Doors close.\n\nNo more registrations.\nLaptop setup.\nInternet check.',
  },
  {
    time: '10:00',
    period: 'AM',
    label: 'Welcome Address',
    note: 'Host welcomes everyone.',
  },
  {
    time: '10:03',
    period: 'AM',
    label: 'ORIGIN Introduction',
    note: '• About ORIGIN\n• Vision\n• Why SANKALP exists',
  },
  {
    time: '10:10',
    period: 'AM',
    label: 'Event Briefing',
    note: 'Explain\n\n• Rules\n• Timeline\n• Evaluation\n• Deliverables\n\nNo surprises later.',
  },
  {
    time: '10:30',
    period: 'AM',
    label: 'Domain Reveal',
    note: 'Every team receives\n\nONE DOMAIN.\n\nExample\n• Healthcare\n• Agriculture\n• Education\n• Cyber Security\n• Environment\n• Tourism\n• Banking\n• Women Safety\n• etc.',
  },
  {
    time: '10:35',
    period: 'AM',
    label: 'Phase 1 · Problem Discovery',
    note: 'Internet allowed.\nResearch allowed.\nDiscussion allowed.\n\nGoal:\nFind ONE real-world problem.\n\nDeliverables:\n• Problem Statement\n• Target Users\n• Existing Solutions\n• Gap Analysis',
  },
  {
    time: '11:00',
    period: 'AM',
    label: 'Mentor Validation Round',
    note: 'Mentors visit every table.\n\nQuestions:\n• Why this problem?\n• Evidence?\n• Market?\n• Users?\n• Why current solutions fail?\n\nOnly validated problems move ahead.',
  },
  {
    time: '12:00',
    period: 'PM',
    label: 'Lunch Break',
    note: 'Networking.\nMentor discussions.\nSponsor booth visits.',
  },
  {
    time: '01:00',
    period: 'PM',
    label: 'Build Sprint',
    note: 'The Silent Zone:\n• No announcements\n• Only mentors move around\n\nDeliverables:\n• Working MVP\n• Presentation\n• Prototype',
  },
  {
    time: '03:30',
    period: 'PM',
    label: 'Submission Window',
    note: 'Submit\n• PPT\n• Prototype\n• Submission Form\n\nLate submissions not accepted.',
  },
]

const RULES = [
  'Teams must consist of 2–3 members from the same institution.',
  'All members must be present at the venue throughout the event.',
  'The domain assigned via the Spin Wheel is final and cannot be changed.',
  'Internet access, open-source libraries, and frameworks are permitted.',
  'AI tools may be used for ideation and reference — not for core solution generation.',
  'The solution must be original. Pre-existing projects are grounds for disqualification.',
  'Mentors may only be consulted during designated mentor validation rounds.',
  'A progress report must be submitted at the 11:00 AM checkpoint.',
  'All members must be present during the final demo presentation.',
  'Plagiarism or unsportsmanlike conduct results in immediate disqualification.',
  'All decisions by the evaluation panel are final and binding.',
]

const CRITERIA = [
  { label: 'Problem Identification', pct: '20%', desc: 'Clarity and depth of real-world problem scoping.' },
  { label: 'Innovation & Feasibility', pct: '25%', desc: 'How novel and practically implementable the solution is.' },
  { label: 'Technical Execution', pct: '25%', desc: 'Quality of prototype, code, or design artifacts produced.' },
  { label: 'Presentation & Demo', pct: '20%', desc: 'Storytelling clarity, structure, and live demonstration.' },
  { label: 'Social Impact', pct: '10%', desc: 'Potential for real-world positive change at scale.' },
]

const DELIVERABLES = [
  'Problem Statement document — clearly scoped and evidence-backed (max 1 page)',
  'Working prototype, high-fidelity mockup, or detailed technical specification',
  'System architecture or solution flow diagram',
  '5-minute demo presentation with live or recorded walkthrough',
]

// Wheel colors — electric blue family with tonal variation
const SEG_COLORS = [
  '#0052F0', '#0A5EFF', '#003CC8', '#0046DC', '#1264F5',
  '#0037C0', '#0050E8', '#003AC2', '#1060F0', '#003ED8',
  '#0056FF', '#003BC0', '#0E62F8', '#0044D5', '#1568FF',
  '#0035BB', '#004EE5', '#0039C0', '#0C5EF2', '#003FD8',
]

type Page = 'home' | 'register' | 'rulebook'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HOOKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function useWindowWidth() {
  const [w, setW] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )
  useEffect(() => {
    const handler = () => setW(window.innerWidth)
    window.addEventListener('resize', handler, { passive: true })
    return () => window.removeEventListener('resize', handler)
  }, [])
  return w
}

function useCountdown(target: Date) {
  const calc = () => {
    const d = target.getTime() - Date.now()
    if (d <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return {
      days: Math.floor(d / 86_400_000),
      hours: Math.floor((d % 86_400_000) / 3_600_000),
      minutes: Math.floor((d % 3_600_000) / 60_000),
      seconds: Math.floor((d % 60_000) / 1_000),
    }
  }
  const [t, setT] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000)
    return () => clearInterval(id)
  }, [])
  return t
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  UTILS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const pad = (n: number) => String(n).padStart(2, '0')

function generateTeamId(): string {
  const n = parseInt(localStorage.getItem('s26_count') || '0') + 1
  localStorage.setItem('s26_count', String(n))
  return `S-${String(n).padStart(3, '0')}`
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  WHEEL MATH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CX = 200
const CY = 200
const R = 178   // outer radius
const RI = 30    // inner hub radius
const RT = 114   // text placement radius
const N = DOMAINS.length
const SA = 360 / N  // segment angle = 18°

const toRad = (deg: number) => (deg - 90) * (Math.PI / 180)
const polar = (deg: number, r: number) => ({
  x: CX + r * Math.cos(toRad(deg)),
  y: CY + r * Math.sin(toRad(deg)),
})

function wedge(startDeg: number, endDeg: number): string {
  const s = polar(startDeg, R)
  const e = polar(endDeg, R)
  const i = polar(startDeg, RI)
  const j = polar(endDeg, RI)
  // Donut-style path: outer arc → inner arc back
  return [
    `M ${i.x.toFixed(2)} ${i.y.toFixed(2)}`,
    `L ${s.x.toFixed(2)} ${s.y.toFixed(2)}`,
    `A ${R} ${R} 0 0 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`,
    `L ${j.x.toFixed(2)} ${j.y.toFixed(2)}`,
    `A ${RI} ${RI} 0 0 0 ${i.x.toFixed(2)} ${i.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CONFETTI COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Particle {
  id: number
  angle: number
  dist: number
  size: number
  delay: number
  color: string
  round: boolean
}

function Confetti({ active }: { active: boolean }) {
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (active) setKey(k => k + 1)
  }, [active])

  const particles = useMemo<Particle[]>(() => {
    const colors = ['#0057FF', '#60A5FA', '#93C5FD', '#ffffff', '#3B82F6', '#BFDBFE']
    return Array.from({ length: 36 }, (_, i) => ({
      id: i,
      angle: (i / 36) * 360 + (Math.random() - 0.5) * 22,
      dist: 100 + Math.random() * 140,
      size: 4 + Math.random() * 7,
      delay: Math.random() * 0.25,
      color: colors[Math.floor(Math.random() * colors.length)],
      round: Math.random() > 0.45,
    }))
  }, [key])

  if (!active) return null

  return (
    <div key={key} style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {particles.map(p => {
        const rad = (p.angle * Math.PI) / 180
        const tx = Math.cos(rad) * p.dist
        const ty = Math.sin(rad) * p.dist
        return (
          <div key={p.id} style={{
            position: 'absolute',
            width: p.size, height: p.size,
            background: p.color,
            borderRadius: p.round ? '50%' : 2,
            animationName: 'particle-burst',
            animationDuration: '1s',
            animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            animationDelay: `${p.delay}s`,
            animationFillMode: 'both',
            ['--tx' as string]: `${tx}px`,
            ['--ty' as string]: `${ty}px`,
          } as React.CSSProperties} />
        )
      })}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  NAV
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const NAV_LINKS: { label: string; page: Page }[] = [
  { label: 'Home', page: 'home' },
  { label: 'Register', page: 'register' },
  { label: 'Rulebook', page: 'rulebook' },
]

function Nav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const [open, setOpen] = useState(false)
  const isMobile = useWindowWidth() <= 680

  const go = (p: Page) => { setPage(p); setOpen(false); window.scrollTo(0, 0) }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.82)',
      backdropFilter: 'blur(28px) saturate(1.6)',
      WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{
        maxWidth: 1160, margin: '0 auto', padding: '0 28px',
        height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Wordmark */}
        <button onClick={() => go('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: 0, padding: 0 }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.5px' }}>SANKALP</span>
          <span style={{ color: '#2B72FF', fontWeight: 800, fontSize: 16, letterSpacing: '-0.5px' }}>'26</span>
        </button>

        {/* Desktop links */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {NAV_LINKS.map(l => (
              <button key={l.page} onClick={() => go(l.page)} style={{
                background: page === l.page ? 'rgba(255,255,255,0.08)' : 'none',
                border: 'none', cursor: 'pointer',
                padding: '6px 14px', borderRadius: 7,
                color: page === l.page ? '#fff' : 'rgba(255,255,255,0.42)',
                fontSize: 13.5, fontWeight: page === l.page ? 500 : 400,
                transition: 'all 0.15s ease', letterSpacing: '0.1px',
              }}>
                {l.label}
              </button>
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!isMobile && (
            <button onClick={() => go('register')} style={{
              background: '#0052F0', border: 'none', cursor: 'pointer',
              padding: '7px 18px', borderRadius: 8, color: '#fff',
              fontSize: 13, fontWeight: 600, letterSpacing: '0.1px',
              transition: 'all 0.18s ease', boxShadow: '0 0 20px rgba(0,82,240,0.35)',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1A64FF' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0052F0' }}
            >
              Register
            </button>
          )}
          {isMobile && (
            <button onClick={() => setOpen(o => !o)} style={{
              background: open ? 'rgba(255,255,255,0.08)' : 'none',
              border: 'none', cursor: 'pointer',
              padding: '8px', borderRadius: 7,
              display: 'flex', flexDirection: 'column', gap: 4.5, alignItems: 'center',
              transition: 'background 0.15s',
            }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  display: 'block', width: 18,
                  height: open && i === 1 ? 0 : 1.5,
                  background: 'rgba(255,255,255,0.7)',
                  borderRadius: 2,
                  transform: open
                    ? i === 0 ? 'rotate(45deg) translate(3px, 4px)'
                      : i === 2 ? 'rotate(-45deg) translate(3px, -4px)'
                        : 'none' : 'none',
                  transition: 'all 0.2s',
                  opacity: open && i === 1 ? 0 : 1,
                }} />
              ))}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu drawer */}
      {isMobile && open && (
        <div style={{
          background: '#050505', borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: '6px 16px 20px',
          animation: 'fade-in 0.18s ease',
        }}>
          {NAV_LINKS.map(l => (
            <button key={l.page} onClick={() => go(l.page)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: page === l.page ? 'rgba(255,255,255,0.05)' : 'none',
              border: 'none', cursor: 'pointer',
              padding: '13px 12px', borderRadius: 8, marginBottom: 2,
              color: page === l.page ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: 15, fontWeight: page === l.page ? 600 : 400,
              transition: 'all 0.12s',
            }}>{l.label}</button>
          ))}
          <button onClick={() => go('register')} style={{
            display: 'block', width: '100%', marginTop: 8,
            background: '#0052F0', border: 'none', cursor: 'pointer',
            padding: '13px', borderRadius: 9, color: '#fff',
            fontSize: 14, fontWeight: 600, textAlign: 'center',
            boxShadow: '0 0 24px rgba(0,82,240,0.3)',
          }}>
            Register Your Team →
          </button>
        </div>
      )}
    </nav>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  FOOTER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '64px 24px 44px',
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Top section */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 32, marginBottom: 48 }}>
          <div>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontWeight: 800, fontSize: 17, color: '#fff', letterSpacing: '-0.4px' }}>SANKALP</span>
              <span style={{ fontWeight: 800, fontSize: 17, color: '#2B72FF', letterSpacing: '-0.4px' }}>'26</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 13, lineHeight: 1.7, maxWidth: 260 }}>
              An 8-hour innovation sprint built for those who observe carefully, think deeply, and build fearlessly.
            </p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.2px', textTransform: 'uppercase', fontWeight: 600, marginBottom: 14 }}>
              Organized by
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
              ORIGIN Association
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
              Dept. of Computer Science & Engineering<br />
              St. Peter's Engineering College, Hyderabad
            </p>
          </div>
        </div>

        {/* Sponsor strip */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 28, marginBottom: 28,
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20,
          justifyContent: 'space-between',
        }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            Technology Partners & Sponsors
          </p>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center', opacity: 0.22 }}>
            {['Sponsor One', 'Sponsor Two', 'Sponsor Three'].map(s => (
              <span key={s} style={{ fontSize: 13, color: '#fff', fontWeight: 500, letterSpacing: '0.2px' }}>{s}</span>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)', letterSpacing: '0.3px' }}>
          © 2026 SANKALP · ORIGIN Association · All rights reserved.
        </p>
      </div>
    </footer>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HOME PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function HomePage({ setPage }: { setPage: (p: Page) => void }) {
  const time = useCountdown(EVENT_DATE)
  const isMobile = useWindowWidth() <= 680
  const go = (p: Page) => { setPage(p); window.scrollTo(0, 0) }

  const countdownUnits = [
    { v: time.days, l: 'Days' },
    { v: time.hours, l: 'Hours' },
    { v: time.minutes, l: 'Minutes' },
    { v: time.seconds, l: 'Seconds' },
  ]

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

      {/* Ambient grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: [
          'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: '72px 72px',
        maskImage: 'radial-gradient(ellipse 75% 75% at 50% 45%, black 35%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 75% 75% at 50% 45%, black 35%, transparent 100%)',
      }} />

      {/* Hero glow */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: [
          'radial-gradient(ellipse 65% 50% at 50% 20%, rgba(0,82,240,0.13) 0%, transparent 100%)',
        ].join(', '),
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '100px 20px 60px' : '120px 40px 80px',
        textAlign: 'center',
      }}>

        {/* Live badge */}
        <div className="anim-fade-up" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,82,240,0.1)',
          border: '1px solid rgba(0,82,240,0.28)',
          borderRadius: 100, padding: '5px 14px 5px 10px', marginBottom: 36,
          animationDelay: '0ms',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 8, height: 8, borderRadius: '50%',
            background: '#2B72FF',
            animation: 'blink-dot 1.8s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#4D90FF', letterSpacing: '0.7px', textTransform: 'uppercase' }}>
            ORIGIN Association · CSE · SPEC
          </span>
        </div>

        <div className="anim-fade-up" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28, animationDelay: '30ms',
        }}>
          <img
            src="/originlogo.jpeg"
            alt="ORIGIN Association logo"
            style={{
              display: 'block',
              width: 'clamp(120px, 18vw, 200px)',
              height: 'auto',
              borderRadius: 18,
              boxShadow: '0 18px 50px rgba(0, 82, 240, 0.22)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: 6,
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Main headline */}
        <h1 className="anim-fade-up" style={{
          fontSize: isMobile ? 72 : 'clamp(80px, 11vw, 120px)',
          fontWeight: 900,
          letterSpacing: isMobile ? '-3px' : '-5px',
          lineHeight: 0.88,
          color: '#fff',
          marginBottom: 20,
          animationDelay: '60ms',
        }}>
          SANKALP<span style={{ color: '#2B72FF' }}>'26</span>
        </h1>

        {/* Tagline */}
        <p className="anim-fade-up" style={{
          fontSize: isMobile ? 17 : 'clamp(18px, 2.2vw, 22px)',
          fontWeight: 300, color: 'rgba(255,255,255,0.5)',
          marginBottom: 10, letterSpacing: '0.1px',
          animationDelay: '110ms',
        }}>
          An 8-Hour Innovation Sprint
        </p>

        <p className="anim-fade-up" style={{
          fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.22)',
          letterSpacing: '3.5px', textTransform: 'uppercase', marginBottom: 48,
          animationDelay: '150ms',
        }}>
          Observe &nbsp;·&nbsp; Think &nbsp;·&nbsp; Build &nbsp;·&nbsp; Defend
        </p>

        {/* Event info */}
        <div className="anim-fade-up" style={{
          display: 'flex', flexWrap: 'wrap', gap: 10,
          justifyContent: 'center', marginBottom: 44,
          animationDelay: '200ms',
        }}>
          {[
            { icon: '📅', text: 'August 5, 2026' },
            { icon: '📍', text: VENUE_SHORT },
            { icon: '⏱', text: '8-Hour Sprint' },
          ].map(item => (
            <div key={item.text} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 100, padding: '6px 14px',
            }}>
              <span style={{ fontSize: 13, lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Countdown */}
        <div className="anim-fade-up" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, overflow: 'hidden',
          marginBottom: 44, width: '100%',
          maxWidth: isMobile ? '100%' : 440,
          animationDelay: '240ms',
        }}>
          {countdownUnits.map((u, i) => (
            <div key={u.l} style={{
              padding: isMobile ? '20px 8px' : '28px 12px',
              textAlign: 'center',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              position: 'relative',
            }}>
              <div style={{
                fontSize: isMobile ? 34 : 42, fontWeight: 800,
                color: '#fff', letterSpacing: '-2px', lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {pad(u.v)}
              </div>
              <div style={{
                fontSize: 10, color: 'rgba(255,255,255,0.28)',
                marginTop: 8, letterSpacing: '1.6px', textTransform: 'uppercase',
                fontWeight: 500,
              }}>
                {u.l}
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="anim-fade-up" style={{
          display: 'flex', flexWrap: 'wrap', gap: 12,
          justifyContent: 'center', animationDelay: '280ms',
        }}>
          <button onClick={() => go('register')} style={{
            background: '#0052F0', border: 'none', cursor: 'pointer',
            padding: isMobile ? '13px 32px' : '14px 40px',
            borderRadius: 10, fontSize: 15, color: '#fff',
            fontWeight: 600, letterSpacing: '0.2px',
            boxShadow: '0 0 50px rgba(0,82,240,0.35)',
            transition: 'all 0.2s ease',
          }}
            onMouseEnter={e => {
              const b = e.currentTarget
              b.style.background = '#1A64FF'
              b.style.boxShadow = '0 0 70px rgba(0,82,240,0.5)'
              b.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              const b = e.currentTarget
              b.style.background = '#0052F0'
              b.style.boxShadow = '0 0 50px rgba(0,82,240,0.35)'
              b.style.transform = 'none'
            }}
          >
            Register Your Team
          </button>
          <button onClick={() => go('rulebook')} style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.14)',
            cursor: 'pointer',
            padding: isMobile ? '13px 32px' : '14px 40px',
            borderRadius: 10, fontSize: 15,
            color: 'rgba(255,255,255,0.75)', fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
            }}
          >
            View Rulebook
          </button>
        </div>

        {/* Credit line */}
        <p className="anim-fade-up" style={{
          marginTop: 56, fontSize: 12,
          color: 'rgba(255,255,255,0.18)',
          lineHeight: 1.7, animationDelay: '320ms',
        }}>
          Organized by <span style={{ color: 'rgba(255,255,255,0.35)' }}>ORIGIN Association</span> · Department of Computer Science & Engineering
        </p>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SHARED FORM PRIMITIVES  (module-level — never remounts on render)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const F_INPUT = (hasErr: boolean): React.CSSProperties => ({
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${hasErr ? 'rgba(255,68,68,0.6)' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: 8, padding: '11px 14px', color: '#fff', fontSize: 14,
  outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
})

const F_LABEL: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: 'rgba(255,255,255,0.38)', letterSpacing: '1px',
  textTransform: 'uppercase', marginBottom: 8,
}

function Field({
  label, value, onChange, placeholder, error, optional = false, type = 'text',
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  placeholder: string
  error?: string
  optional?: boolean
  type?: string
}) {
  return (
    <div>
      <label style={F_LABEL}>
        {label}{' '}
        {optional && <span style={{ color: 'rgba(255,255,255,0.18)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>}
      </label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={F_INPUT(!!error)} />
      {error && <p style={{ color: '#FF5A5A', fontSize: 11, marginTop: 5, fontWeight: 500 }}>{error}</p>}
    </div>
  )
}

function StepLabel({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(0,82,240,0.15)', border: '1px solid rgba(43,114,255,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800, color: '#2B72FF',
      }}>{n}</div>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.3px' }}>{label}</p>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  REGISTRATION PAGE  (form + wheel + WhatsApp submit)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const WA_NUMBER = '919110568327'

type FormState = {
  teamName: string
  leader: string; roll1: string
  member2: string; roll2: string
  member3: string; roll3: string
  branch: string; year: string; mobile: string
}

const EMPTY: FormState = {
  teamName: '', leader: '', roll1: '',
  member2: '', roll2: '', member3: '', roll3: '',
  branch: '', year: '', mobile: '',
}

function buildWhatsAppMessage(form: FormState, teamId: string, domain: string): string {
  const members = [
    `• Leader : ${form.leader} (${form.roll1})`,
    form.member2 ? `• Member 2 : ${form.member2}${form.roll2 ? ` (${form.roll2})` : ''}` : '',
    form.member3 ? `• Member 3 : ${form.member3}${form.roll3 ? ` (${form.roll3})` : ''}` : '',
  ].filter(Boolean).join('\n')

  return [
    `🎯 *SANKALP'26 — Team Registration*`,
    ``,
    `*Team ID :* ${teamId}`,
    `*Team Name :* ${form.teamName}`,
    ``,
    `*👥 Members*`,
    members,
    ``,
    `*📚 Branch :* ${form.branch}`,
    `*📅 Year :* ${form.year}`,
    `*📱 Mobile :* ${form.mobile}`,
    ``,
    `*🎯 Assigned Domain :* ${domain}`,
    ``,
    `_Submitted via SANKALP'26 website_`,
  ].join('\n')
}

// Embedded mini-wheel for the registration page
const RW_CX = 160, RW_CY = 160, RW_R = 142, RW_RI = 24, RW_RT = 90
const rPolar = (deg: number, r: number) => ({
  x: RW_CX + r * Math.cos(toRad(deg)),
  y: RW_CY + r * Math.sin(toRad(deg)),
})
function rWedge(startDeg: number, endDeg: number): string {
  const s = rPolar(startDeg, RW_R), e = rPolar(endDeg, RW_R)
  const i = rPolar(startDeg, RW_RI), j = rPolar(endDeg, RW_RI)
  return [
    `M ${i.x.toFixed(2)} ${i.y.toFixed(2)}`,
    `L ${s.x.toFixed(2)} ${s.y.toFixed(2)}`,
    `A ${RW_R} ${RW_R} 0 0 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`,
    `L ${j.x.toFixed(2)} ${j.y.toFixed(2)}`,
    `A ${RW_RI} ${RW_RI} 0 0 0 ${i.x.toFixed(2)} ${i.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

function RegistrationPage() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'wheel', string>>>({})
  const [wheelRot, setWheelRot] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [hasSpun, setHasSpun] = useState(false)
  const [domainIdx, setDomainIdx] = useState<number | null>(null)
  const [confetti, setConfetti] = useState(false)
  const [sent, setSent] = useState(false)
  const [teamId, setTeamId] = useState('')
  const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const isMobile = useWindowWidth() <= 680

  useEffect(() => () => { if (spinTimer.current) clearTimeout(spinTimer.current) }, [])

  const setField = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(f => ({ ...f, [k]: e.target.value }))
      setErrors(err => { const n = { ...err }; delete n[k]; return n })
    }

  const validateForm = (): boolean => {
    const e: Partial<Record<keyof FormState | 'wheel', string>> = {}
    if (!form.teamName.trim()) e.teamName = 'Required'
    if (!form.leader.trim()) e.leader = 'Required'
    if (!form.roll1.trim()) e.roll1 = 'Required'
    if (!form.branch.trim()) e.branch = 'Required'
    if (!form.year) e.year = 'Required'
    if (!/^\d{10}$/.test(form.mobile.trim())) e.mobile = 'Enter a valid 10-digit number'
    if (!hasSpun) e.wheel = 'Please spin the wheel to get your domain before registering.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const doSpin = () => {
    if (spinning || hasSpun) return
    const target = Math.floor(Math.random() * N)
    const finalOff = ((270 - (target + 0.5) * SA) % 360 + 360) % 360
    const total = Math.ceil((wheelRot + 360 * 8) / 360) * 360 + finalOff
    setSpinning(true)
    setConfetti(false)
    setWheelRot(total)
    setDomainIdx(target)
    setErrors(err => { const n = { ...err }; delete n['wheel']; return n })
    spinTimer.current = setTimeout(() => {
      setSpinning(false)
      setHasSpun(true)
      setConfetti(true)
      wheelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 5500 + 200)
  }

  const handleRegister = () => {
    if (!validateForm()) return
    const id = generateTeamId()
    const dom = DOMAINS[domainIdx!]
    const msg = buildWhatsAppMessage(form, id, dom)
    setTeamId(id)
    setSent(true)
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
    window.scrollTo(0, 0)
  }

  const cardSt: React.CSSProperties = {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: isMobile ? '20px 18px' : '26px 26px',
    display: 'flex', flexDirection: 'column', gap: 18,
  }

  // ── Success screen ───────────────────────────────────────────────

  if (sent) {
    const members = [form.leader, form.member2, form.member3].filter(Boolean)
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 60px' }}>
        <div className="result-card" style={{
          maxWidth: 460, width: '100%', textAlign: 'center',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 24, padding: isMobile ? '40px 24px' : '52px 44px',
        }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', margin: '0 auto 28px', background: 'rgba(0,82,240,0.1)', border: '1px solid rgba(0,82,240,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5l5 5 9-9" stroke="#2B72FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <p style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: '#2B72FF', fontWeight: 700, marginBottom: 14 }}>Registration Sent</p>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 6, color: '#fff' }}>{form.teamName}</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 28 }}>{members.join(' · ')}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
            <div style={{ background: 'rgba(0,82,240,0.07)', border: '1px solid rgba(0,82,240,0.2)', borderRadius: 12, padding: '18px' }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 8 }}>Team ID</p>
              <p style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1.5px', color: '#2B72FF', lineHeight: 1 }}>{teamId}</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px' }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 8 }}>Domain</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{domainIdx !== null ? DOMAINS[domainIdx] : ''}</p>
            </div>
          </div>

          <div style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.522 5.851L.057 23.854a.5.5 0 0 0 .609.61l6.101-1.485A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.877 9.877 0 0 1-5.021-1.368l-.36-.214-3.724.906.935-3.633-.235-.374A9.843 9.843 0 0 1 2.118 12C2.118 6.54 6.54 2.118 12 2.118S21.882 6.54 21.882 12 17.46 21.882 12 21.882z" />
            </svg>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              Your details were sent to the organizer via WhatsApp. Check your phone if the chat didn't open.
            </p>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 12, lineHeight: 1.8 }}>
            Arrive by <strong style={{ color: 'rgba(255,255,255,0.6)' }}>8:30 AM</strong> on August 5, 2026. Carry your college ID.
          </p>
        </div>
      </div>
    )
  }

  // ── Main page ────────────────────────────────────────────────────

  const assignedDomain = domainIdx !== null ? DOMAINS[domainIdx] : null
  const wheelSize = isMobile ? Math.min(window.innerWidth - 40, 300) : 360

  return (
    <div style={{ padding: isMobile ? '88px 16px 80px' : '100px 24px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: 620, width: '100%' }}>

        {/* Header */}
        <div className="anim-fade-up" style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: '#2B72FF', fontWeight: 700, marginBottom: 12 }}>
            Registration
          </p>
          <h1 style={{ fontSize: isMobile ? 30 : 38, fontWeight: 800, letterSpacing: '-1.2px', marginBottom: 10, color: '#fff' }}>
            Register Your Team
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, lineHeight: 1.7 }}>
            Fill in your team details, spin the wheel to get your domain, then hit Register.
          </p>
        </div>

        {/* ── Step 1: Form ─────────────────────────────────────────── */}

        <StepLabel n={1} label="Team Details" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 44 }}>
          <div style={cardSt}>
            <p style={{ ...F_LABEL, marginBottom: 0 }}>Team Information</p>
            <Field label="Team Name" value={form.teamName} onChange={setField('teamName')} placeholder="e.g. Quantum Nexus" error={errors.teamName} />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <Field label="Branch" value={form.branch} onChange={setField('branch')} placeholder="e.g. CSE" error={errors.branch} />
              <div>
                <label style={F_LABEL}>Year</label>
                <select value={form.year} onChange={setField('year')} style={F_INPUT(!!errors.year)}>
                  <option value="">Select year</option>
                  {['I Year', 'II Year', 'III Year', 'IV Year'].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                {errors.year && <p style={{ color: '#FF5A5A', fontSize: 11, marginTop: 5 }}>{errors.year}</p>}
              </div>
            </div>
            <Field label="Mobile Number" value={form.mobile} onChange={setField('mobile')} placeholder="10-digit number" error={errors.mobile} type="tel" />
          </div>

          <div style={cardSt}>
            <p style={{ ...F_LABEL, marginBottom: 0 }}>Team Members</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 14 }}>
              <Field label="Team Leader" value={form.leader} onChange={setField('leader')} placeholder="Full name" error={errors.leader} />
              <Field label="Roll Number" value={form.roll1} onChange={setField('roll1')} placeholder="e.g. 22CSE001" error={errors.roll1} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 14 }}>
              <Field label="Member 2" value={form.member2} onChange={setField('member2')} placeholder="Full name" optional />
              <Field label="Roll Number" value={form.roll2} onChange={setField('roll2')} placeholder="e.g. 22CSE002" optional />
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 14 }}>
              <Field label="Member 3" value={form.member3} onChange={setField('member3')} placeholder="Full name" optional />
              <Field label="Roll Number" value={form.roll3} onChange={setField('roll3')} placeholder="e.g. 22CSE003" optional />
            </div>
          </div>
        </div>

        {/* ── Step 2: Spin Wheel ───────────────────────────────────── */}

        <StepLabel n={2} label="Spin Your Domain" />

        <div ref={wheelRef} style={{
          background: 'rgba(255,255,255,0.025)',
          border: `1px solid ${errors.wheel ? 'rgba(255,68,68,0.4)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 20, padding: isMobile ? '28px 20px' : '36px 40px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 24, marginBottom: 32, position: 'relative', overflow: 'hidden',
        }}>
          {/* Ambient glow behind wheel */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,82,240,0.08) 0%, transparent 100%)',
            transition: 'opacity 0.5s',
            opacity: spinning ? 1 : hasSpun ? 0.7 : 0.4,
          }} />

          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', textAlign: 'center', lineHeight: 1.6, position: 'relative' }}>
            {hasSpun
              ? 'Domain locked. Proceed to register.'
              : 'One spin. One domain. This determines your challenge for the next 8 hours.'}
          </p>

          {/* Pointer */}
          <div style={{ marginBottom: -14, zIndex: 2 }}>
            <svg width="24" height="22" viewBox="0 0 24 22">
              <defs>
                <filter id="rptr-shadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,82,240,0.6)" />
                </filter>
              </defs>
              <polygon points="12,20 1,3 23,3" fill="#fff" filter="url(#rptr-shadow)" />
              <polygon points="12,20 1,3 23,3" fill="none" stroke="#2B72FF" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Wheel SVG */}
          <div style={{ position: 'relative' }}>
            <svg width={wheelSize} viewBox="0 0 320 320" style={{ display: 'block', overflow: 'visible' }}>
              <defs>
                <filter id="rw-shadow" x="-15%" y="-15%" width="130%" height="130%">
                  <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="rgba(0,82,240,0.25)" />
                </filter>
                {SEG_COLORS.map((c, i) => (
                  <radialGradient key={i} id={`rwg${i}`} cx="25%" cy="50%" r="80%">
                    <stop offset="0%" stopColor={c} stopOpacity="0.85" />
                    <stop offset="100%" stopColor={c} />
                  </radialGradient>
                ))}
              </defs>

              <circle cx={RW_CX} cy={RW_CY} r={RW_R + 4} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

              <g style={{
                transformOrigin: `${RW_CX}px ${RW_CY}px`,
                transform: `rotate(${wheelRot}deg)`,
                transition: spinning ? 'transform 5500ms cubic-bezier(0.15, 0.68, 0.08, 1.0)' : 'none',
                filter: 'url(#rw-shadow)',
              }}>
                {DOMAINS.map((_, i) => {
                  const s = i * SA, e = (i + 1) * SA, m = (i + 0.5) * SA
                  const tp = rPolar(m, RW_RT)
                  const lines = WHEEL_LABELS[i].split('\n')
                  return (
                    <g key={i}>
                      <path d={rWedge(s, e)} fill={`url(#rwg${i})`} stroke="rgba(0,0,0,0.4)" strokeWidth="0.7" />
                      <text textAnchor="middle" dominantBaseline="central"
                        transform={`translate(${tp.x.toFixed(2)},${tp.y.toFixed(2)}) rotate(${m})`}
                        fontSize={lines.length > 1 ? '6.2' : '7'} fontWeight="600"
                        fill="rgba(255,255,255,0.92)" fontFamily="Inter, sans-serif" pointerEvents="none">
                        {lines.map((line, li) => (
                          <tspan key={li} x="0" dy={li === 0 ? (lines.length > 1 ? -4 : 0) : 9}>{line}</tspan>
                        ))}
                      </text>
                    </g>
                  )
                })}
                {/* Tick marks */}
                {DOMAINS.map((_, i) => {
                  const deg = i * SA
                  const o = rPolar(deg, RW_R), inn = rPolar(deg, RW_R - 8)
                  return <line key={`rt${i}`} x1={inn.x} y1={inn.y} x2={o.x} y2={o.y} stroke="rgba(0,0,0,0.45)" strokeWidth="0.7" />
                })}
                <circle cx={RW_CX} cy={RW_CY} r={RW_RI + 8} fill="#060606" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <circle cx={RW_CX} cy={RW_CY} r={RW_RI} fill="#000" stroke="rgba(43,114,255,0.4)" strokeWidth="1" />
                <circle cx={RW_CX} cy={RW_CY} r={5} fill="#2B72FF" />
              </g>
              <circle cx={RW_CX} cy={RW_CY} r={RW_R + 1} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
            </svg>

            {/* Confetti */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <Confetti active={confetti} />
            </div>
          </div>

          {/* Spin button */}
          {!hasSpun ? (
            <button onClick={doSpin} disabled={spinning} style={{
              background: spinning ? 'rgba(0,82,240,0.35)' : '#0052F0',
              border: 'none', cursor: spinning ? 'default' : 'pointer',
              padding: '13px 44px', borderRadius: 10, fontSize: 14,
              color: spinning ? 'rgba(255,255,255,0.45)' : '#fff',
              fontWeight: 700, letterSpacing: '0.3px',
              boxShadow: spinning ? 'none' : '0 0 40px rgba(0,82,240,0.35)',
              transition: 'all 0.25s',
            }}>
              {spinning ? 'Spinning…' : 'Spin the Wheel →'}
            </button>
          ) : (
            <div className="anim-scale-in" style={{
              width: '100%', textAlign: 'center',
              background: 'rgba(0,82,240,0.07)',
              border: '1px solid rgba(43,114,255,0.25)',
              borderRadius: 14, padding: '20px 24px',
            }}>
              <p style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: '#4D90FF', fontWeight: 700, marginBottom: 8 }}>
                Assigned Domain
              </p>
              <p style={{ fontSize: isMobile ? 24 : 30, fontWeight: 900, letterSpacing: '-1px', color: '#fff', lineHeight: 1 }}>
                {assignedDomain}
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 100, padding: '5px 12px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2B72FF', display: 'inline-block', animation: 'blink-dot 1.8s ease-in-out infinite' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>Wheel locked</span>
              </div>
            </div>
          )}

          {errors.wheel && (
            <p style={{ color: '#FF5A5A', fontSize: 12, fontWeight: 500, textAlign: 'center', marginTop: -8 }}>{errors.wheel}</p>
          )}
        </div>

        {/* ── Step 3: Register ─────────────────────────────────────── */}

        <StepLabel n={3} label="Complete Registration" />

        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: isMobile ? '20px 18px' : '24px 26px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.522 5.851L.057 23.854a.5.5 0 0 0 .609.61l6.101-1.485A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.877 9.877 0 0 1-5.021-1.368l-.36-.214-3.724.906.935-3.633-.235-.374A9.843 9.843 0 0 1 2.118 12C2.118 6.54 6.54 2.118 12 2.118S21.882 6.54 21.882 12 17.46 21.882 12 21.882z" />
            </svg>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
              Clicking Register will open WhatsApp with your details pre-filled.
            </p>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
            Your team info, roll numbers, branch, year, and assigned domain will be sent directly to the ORIGIN Association organizer. Make sure WhatsApp is installed on this device.
          </p>
        </div>

        <button onClick={handleRegister} style={{
          width: '100%', background: '#0052F0', border: 'none', cursor: 'pointer',
          padding: '16px', borderRadius: 12, fontSize: 16, color: '#fff',
          fontWeight: 700, letterSpacing: '0.2px',
          boxShadow: '0 0 44px rgba(0,82,240,0.32)',
          transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#1A64FF'
            e.currentTarget.style.boxShadow = '0 0 60px rgba(0,82,240,0.5)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#0052F0'
            e.currentTarget.style.boxShadow = '0 0 44px rgba(0,82,240,0.32)'
            e.currentTarget.style.transform = 'none'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.522 5.851L.057 23.854a.5.5 0 0 0 .609.61l6.101-1.485A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.877 9.877 0 0 1-5.021-1.368l-.36-.214-3.724.906.935-3.633-.235-.374A9.843 9.843 0 0 1 2.118 12C2.118 6.54 6.54 2.118 12 2.118S21.882 6.54 21.882 12 17.46 21.882 12 21.882z" />
          </svg>
          Register via WhatsApp
        </button>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RULEBOOK PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function RulebookSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 56 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 3, height: 18, background: '#2B72FF', borderRadius: 2, flexShrink: 0 }} />
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

function RulebookPage({ setPage }: { setPage: (p: Page) => void }) {
  const isMobile = useWindowWidth() <= 680
  const go = (p: Page) => { setPage(p); window.scrollTo(0, 0) }

  return (
    <div style={{ minHeight: '100vh', padding: isMobile ? '88px 16px 60px' : '100px 40px 80px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: 760, width: '100%' }}>
        <div className="anim-fade-up" style={{ marginBottom: 52 }}>
          <p style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: '#2B72FF', fontWeight: 700, marginBottom: 12 }}>
            Rulebook
          </p>
          <h1 style={{ fontSize: isMobile ? 30 : 42, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 12, color: '#fff' }}>
            SANKALP'26 Guidelines
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 15, lineHeight: 1.75 }}>
            Read carefully before the event. Participation constitutes acceptance of all rules and decisions made by the organizing committee.
          </p>
        </div>

        {/* Overview */}
        <RulebookSection title="Event Overview">
          <div style={{
            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: isMobile ? '20px' : '28px 30px',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.85, marginBottom: 16 }}>
              SANKALP'26 is an intensive 8-hour innovation sprint where teams are challenged to identify, analyze, and prototype solutions for real-world problems. Each team is randomly assigned a domain via the Spin Wheel — and from that moment, the clock starts.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.85 }}>
              There are no pre-defined problems. The challenge is to <em style={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>discover</em> the problem — one that is underserved, overlooked, or inadequately addressed — and build a compelling, technically grounded response to it.
            </p>
          </div>
        </RulebookSection>

        {/* Rules */}
        <RulebookSection title="Rules & Regulations">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {RULES.map((rule, i) => (
              <div key={i} style={{
                display: 'flex', gap: 16, alignItems: 'flex-start',
                padding: '14px 18px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                transition: 'background 0.15s',
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#2B72FF',
                  minWidth: 22, marginTop: 2, fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.5px',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 14, lineHeight: 1.75 }}>{rule}</p>
              </div>
            ))}
          </div>
        </RulebookSection>

        {/* Evaluation */}
        <RulebookSection title="Evaluation Criteria">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CRITERIA.map(c => (
              <div key={c.label} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: isMobile ? '14px 16px' : '16px 22px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{c.label}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{c.desc}</p>
                </div>
                <div style={{
                  fontSize: 20, fontWeight: 900, color: '#2B72FF',
                  letterSpacing: '-0.5px', minWidth: 46, textAlign: 'right',
                  flexShrink: 0,
                }}>
                  {c.pct}
                </div>
              </div>
            ))}
          </div>
        </RulebookSection>

        {/* Timeline */}
        <RulebookSection title="Event Timeline">
          <div style={{ position: 'relative', paddingLeft: isMobile ? 16 : 24 }}>
            {/* Vertical line */}
            <div style={{
              position: 'absolute',
              left: isMobile ? 50 : 62,
              top: 8, bottom: 8,
              width: 1,
              background: 'linear-gradient(to bottom, rgba(0,82,240,0.4), rgba(255,255,255,0.06) 60%, transparent)',
            }} />

            {TIMELINE.map((item, i) => {
              const isFirst = i === 0
              return (
                <div key={i} style={{
                  display: 'flex', gap: 0, alignItems: 'flex-start',
                  marginBottom: i < TIMELINE.length - 1 ? 0 : 0,
                }}>
                  {/* Time col */}
                  <div style={{ minWidth: isMobile ? 50 : 62, paddingRight: 16, paddingTop: 12, textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                      {item.time}
                    </span>
                    <span style={{ display: 'block', fontSize: 9, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.5px' }}>
                      {item.period}
                    </span>
                  </div>

                  {/* Dot + content */}
                  <div style={{ position: 'relative', paddingLeft: 22, paddingTop: 10, paddingBottom: 24, flex: 1 }}>
                    <div style={{
                      position: 'absolute', left: -5, top: 14,
                      width: 10, height: 10, borderRadius: '50%',
                      background: isFirst ? '#2B72FF' : 'rgba(255,255,255,0.12)',
                      border: isFirst ? '2px solid rgba(43,114,255,0.5)' : 'none',
                      boxShadow: isFirst ? '0 0 12px rgba(43,114,255,0.5)' : 'none',
                      flexShrink: 0,
                    }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4, lineHeight: 1.3 }}>
                      {item.label}
                    </p>
                    <p style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.35)',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-line',
                    }}>
                      {item.note}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </RulebookSection>

        {/* Deliverables */}
        <RulebookSection title="Deliverables">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {DELIVERABLES.map((d, i) => (
              <div key={i} style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                padding: '14px 18px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="#2B72FF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 14, lineHeight: 1.7 }}>{d}</p>
              </div>
            ))}
          </div>
        </RulebookSection>

        {/* Footer CTAs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 8 }}>
          <button onClick={() => go('register')} style={{
            background: '#0052F0', border: 'none', cursor: 'pointer',
            padding: '13px 30px', borderRadius: 10, fontSize: 14,
            color: '#fff', fontWeight: 600, transition: 'all 0.2s',
          }}>Register Now</button>
        </div>
      </div>
    </div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ROOT APP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function App() {
  const [page, setPage] = useState<Page>('home')

  useEffect(() => { localStorage.removeItem('s26_count') }, [])

  const navigate = (p: Page) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Nav page={page} setPage={navigate} />
      <main style={{ flex: 1 }}>
        {page === 'home' && <HomePage setPage={navigate} />}
        {page === 'register' && <RegistrationPage />}
        {page === 'rulebook' && <RulebookPage setPage={navigate} />}
      </main>
      <Footer />
    </div>
  )
}
