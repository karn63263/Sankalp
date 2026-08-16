import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight, Download, RefreshCw, CheckCircle, Home as HomeIcon, AlertCircle, Star, Search } from 'lucide-react';
import ParticleField from '../components/ParticleField';
import CertificateCanvas from '../components/CertificateCanvas';
import type { AppState, Participant, CertificateRecord } from '../store/store';
import { generateVerificationId, sanitizeFilename, saveState } from '../store/store';
import { generateCertificatePDF, downloadBlob } from '../utils/pdfGenerator';

type Stage = 'intro' | 'hero' | 'generating' | 'notfound' | 'ready' | 'thankyou';
type NameStatus = 'idle' | 'found' | 'notfound';

interface FormData {
  name: string;
  rollNumber: string;
  year: string;
  department: string;
}

const STEPS = [
  { label: 'VERIFYING DETAILS',      sub: 'Scanning participant database...' },
  { label: 'FINDING PARTICIPANT',    sub: 'Locating your record...' },
  { label: 'GENERATING CERTIFICATE', sub: 'Composing your certificate...' },
  { label: 'READY',                  sub: 'Certificate prepared.' },
];

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60_000;
const ACC = '#3dffa0';
const GOLD = '#f5c842';

interface HomeProps { state: AppState; setState: (s: AppState) => void; }

export default function Home({ state, setState }: HomeProps) {
  const [form, setForm] = useState<FormData>({ name: '', rollNumber: '', year: '', department: '' });
  const [stage, setStage] = useState<Stage>('intro');
  const [nameStatus, setNameStatus] = useState<NameStatus>('idle');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [certBlob, setCertBlob] = useState<Blob | null>(null);
  const [dlState, setDlState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [vid, setVid] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const [flash, setFlash] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const attempts = useRef<number[]>([]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spX = useSpring(mouseX, { stiffness: 55, damping: 22 });
  const spY = useSpring(mouseY, { stiffness: 55, damping: 22 });

  useEffect(() => {
    const mv = (e: MouseEvent) => { mouseX.set(e.clientX); mouseY.set(e.clientY); };
    window.addEventListener('mousemove', mv, { passive: true });
    return () => window.removeEventListener('mousemove', mv);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const t = setTimeout(() => setStage('hero'), 2400);
    return () => clearTimeout(t);
  }, []);

  // Real-time name verification against all uploaded sheets
  useEffect(() => {
    const sheets = state.verifySheets ?? [];
    if (!sheets.length) { setNameStatus('idle'); return; }
    const name = form.name.trim().toLowerCase();
    if (!name) { setNameStatus('idle'); return; }

    const t = setTimeout(() => {
      const found = sheets.some(sh =>
        sh.rows.some(r => Object.values(r).some(v => v.toLowerCase() === name))
      );
      setNameStatus(found ? 'found' : 'notfound');
    }, 260); // debounce
    return () => clearTimeout(t);
  }, [form.name, state.verifySheets]);

  const checkRate = useCallback(() => {
    const now = Date.now();
    attempts.current = attempts.current.filter(t => now - t < RATE_LIMIT_WINDOW);
    if (attempts.current.length >= RATE_LIMIT_MAX) return false;
    attempts.current.push(now);
    return true;
  }, []);

  const hasSheets = (state.verifySheets ?? []).length > 0;
  const canGenerate = form.name.trim().length > 0;

  const handleGenerate = async () => {
    if (!form.name.trim() || stage !== 'hero') return;
    if (!state.isPublished) {
      alert("Certificate system is not yet live. Please check back soon.");
      return;
    }
    if (!checkRate()) {
      setRateLimited(true);
      setTimeout(() => setRateLimited(false), 30_000);
      return;
    }

    // Always generate regardless of name match
    setStage('generating');
    setStepIdx(0);

    for (let i = 1; i < STEPS.length; i++) {
      await pause(820);
      setStepIdx(i);
    }
    await pause(400);

    const formParticipant: Participant = {
      rollNumber: form.rollNumber.trim() || '—',
      name: form.name.trim(),
      branch: form.department.trim(),
      year: form.year,
      team: '',
      phone: '',
      certificateType: 'appreciation',
    };

    setParticipant(formParticipant);

    const roll = formParticipant.rollNumber;
    let verifyId = state.certificates.find(c => c.rollNumber === roll)?.verificationId;
    if (!verifyId) {
      verifyId = generateVerificationId(roll);
      const rec: CertificateRecord = { rollNumber: roll, verificationId: verifyId, generatedAt: new Date().toISOString() };
      const next = { ...state, certificates: [...state.certificates, rec] };
      setState(next); saveState(next);
    }
    setVid(verifyId);

    setFlash(true);
    setTimeout(() => setFlash(false), 700);

    const tpl = state.templateAppreciation;
    generateCertificatePDF(formParticipant, tpl.url ?? '', tpl.fields, verifyId, state.eventDate)
      .then(setCertBlob).catch(() => setCertBlob(null));

    setStage('ready');
  };

  const handleDownload = async () => {
    if (dlState !== 'idle' || !participant) return;
    setDlState('loading');
    await pause(1200);
    if (certBlob) downloadBlob(certBlob, `SANKALP26_Certificate_${sanitizeFilename(participant.name)}.pdf`);
    const next = {
      ...state,
      certificates: state.certificates.map(c =>
        c.rollNumber === participant.rollNumber ? { ...c, downloadedAt: new Date().toISOString() } : c
      ),
    };
    setState(next); saveState(next);
    setDlState('done');
    await pause(1100);
    setStage('thankyou');
  };

  const reset = () => {
    setStage('hero');
    setForm({ name: '', rollNumber: '', year: '', department: '' });
    setNameStatus('idle');
    setParticipant(null); setCertBlob(null); setDlState('idle'); setStepIdx(0);
    setTimeout(() => firstInputRef.current?.focus(), 320);
  };

  // Live preview participant built from current form
  const previewParticipant: Participant = {
    rollNumber: form.rollNumber.trim() || '—',
    name: form.name.trim() || 'Your Name',
    branch: form.department.trim() || '—',
    year: form.year || '—',
    team: '',
    phone: '',
    certificateType: 'appreciation',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#07070a', position: 'relative', overflow: 'hidden' }}>
      <ParticleField count={60} />
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: '-18vh', left: '50%', transform: 'translateX(-50%)', width: 1000, height: 560, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(61,255,160,0.045) 0%, transparent 68%)', pointerEvents: 'none' }} />
      <motion.div style={{ position: 'fixed', width: 640, height: 640, borderRadius: '50%', background: 'radial-gradient(circle, rgba(61,255,160,0.055) 0%, transparent 62%)', left: spX, top: spY, x: '-50%', y: '-50%', pointerEvents: 'none', zIndex: 1 }} />

      <AnimatePresence>
        {flash && (
          <motion.div key="flash" initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.65, ease: 'easeOut' }}
            style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 200, pointerEvents: 'none' }} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {stage === 'intro' && <IntroSplash key="intro" />}
        {stage === 'hero' && (
          <FormStage key="hero"
            form={form} setForm={setForm}
            nameStatus={nameStatus} hasSheets={hasSheets}
            canGenerate={canGenerate}
            onGenerate={handleGenerate}
            firstInputRef={firstInputRef}
            rateLimited={rateLimited}
            previewParticipant={previewParticipant}
            templateUrl={state.templateAppreciation.url}
            templateFields={state.templateAppreciation.fields}
            eventDate={state.eventDate}
          />
        )}
        {stage === 'generating' && <GeneratingStage key="generating" stepIdx={stepIdx} name={form.name.trim()} />}
        {stage === 'notfound' && <NotFoundStage key="notfound" name={form.name.trim()} onReset={reset} />}
        {stage === 'ready' && participant && (
          <ReadyStage key="ready" participant={participant} verificationId={vid}
            templateUrl={state.templateAppreciation.url} fields={state.templateAppreciation.fields}
            onDownload={handleDownload} dlState={dlState} />
        )}
        {stage === 'thankyou' && participant && (
          <ThankYouStage key="ty" participant={participant} onReset={reset} onDownload={handleDownload} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── INTRO SPLASH ─── */
function IntroSplash() {
  const lines = ['ORIGIN ASSOCIATION', 'DEPT. OF COMPUTER SCIENCE', 'INITIALIZING CERTIFICATE SYSTEM'];
  return (
    <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
      style={{ position: 'relative', zIndex: 50, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#07070a' }}>
      <motion.div initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        style={{ marginBottom: 40, textAlign: 'center' }}>
        <SplashTitle />
      </motion.div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        {lines.map((line, i) => (
          <motion.div key={line} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.18, duration: 0.4 }}
            style={{ fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '0.2em', color: i === lines.length - 1 ? ACC : 'rgba(255,255,255,0.25)' }}>
            {i === lines.length - 1 && <span style={{ color: ACC, marginRight: 8 }}>›</span>}
            {line}
            {i === lines.length - 1 && <BlinkCursor />}
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ top: '-2px', opacity: 0.8 }} animate={{ top: '100%', opacity: 0 }}
        transition={{ delay: 0.3, duration: 1.6, ease: 'linear' }}
        style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${ACC}, transparent)`, boxShadow: `0 0 8px ${ACC}`, pointerEvents: 'none' }}
      />
    </motion.div>
  );
}

function SplashTitle() {
  const chars = 'SANKALP'.split('');
  return (
    <div style={{ display: 'flex', alignItems: 'baseline' }}>
      {chars.map((c, i) => (
        <motion.span key={i} initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.05 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(56px, 12vw, 108px)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.04em', color: '#eeeef5', display: 'inline-block' }}>
          {c}
        </motion.span>
      ))}
      <motion.span initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.05 + chars.length * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(56px, 12vw, 108px)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.04em', color: ACC, display: 'inline-block' }}>
        '26
      </motion.span>
    </div>
  );
}

function BlinkCursor() {
  return <span style={{ marginLeft: 4, animation: 'cursor-blink 0.9s step-end infinite', color: ACC }}>▊</span>;
}

/* ─── FORM STAGE ─── */
function FormStage({ form, setForm, nameStatus, hasSheets, canGenerate, onGenerate, firstInputRef, rateLimited, previewParticipant, templateUrl, templateFields, eventDate }: {
  form: FormData;
  setForm: (f: FormData) => void;
  nameStatus: NameStatus;
  hasSheets: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
  firstInputRef: React.RefObject<HTMLInputElement | null>;
  rateLimited: boolean;
  previewParticipant: Participant;
  templateUrl: string | null;
  templateFields: AppState['templateAppreciation']['fields'];
  eventDate: string;
}) {
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const chars = 'SANKALP'.split('');

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: 'clamp(12px,2vh,16px) 16px',
    fontFamily: 'Inter', fontSize: 'clamp(14px,2vw,15px)',
    background: 'rgba(255,255,255,0.033)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 12, color: '#eeeef5', outline: 'none',
    transition: 'border-color 0.25s, box-shadow 0.25s',
    caretColor: ACC, boxSizing: 'border-box',
  };

  const nameColor = nameStatus === 'found' ? ACC : nameStatus === 'notfound' ? '#ff6b6b' : 'rgba(238,238,245,0.35)';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97, filter: 'blur(8px)' }} transition={{ duration: 0.55 }}
      style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: 'max(72px,8vh) 20px 60px', overflowY: 'auto' }}>

      {/* NAV */}
      <motion.nav initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.5 }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px clamp(20px,5vw,52px)', borderBottom: '1px solid rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', zIndex: 20, background: 'rgba(7,7,10,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="accent-dot" />
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: ACC }}>ORIGIN ASSOCIATION</span>
        </div>
        <a href="/admin" style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(255,255,255,0.2)', textDecoration: 'none', letterSpacing: '0.18em', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}>
          ADMIN →
        </a>
      </motion.nav>

      <div style={{ width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.55 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(61,255,160,0.06)', border: '1px solid rgba(61,255,160,0.16)', borderRadius: 100, padding: '5px 18px', marginBottom: 'clamp(16px,3vh,28px)' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: ACC, boxShadow: `0 0 6px ${ACC}`, display: 'inline-block' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: ACC, letterSpacing: '0.2em' }}>
            DEPT. OF COMPUTER SCIENCE · 8-HOUR INNOVATION SPRINT
          </span>
        </motion.div>

        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', marginBottom: 'clamp(4px,1vh,8px)', overflow: 'visible' }}>
          {chars.map((c, i) => (
            <motion.span key={i} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 + i * 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(44px, 10vw, 96px)', fontWeight: 700, lineHeight: 0.88, letterSpacing: '-0.042em', color: '#eeeef5', display: 'inline-block' }}>
              {c}
            </motion.span>
          ))}
          <motion.span initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 + chars.length * 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(44px, 10vw, 96px)', fontWeight: 700, lineHeight: 0.88, letterSpacing: '-0.042em', color: ACC, display: 'inline-block' }}>
            '26
          </motion.span>
        </div>

        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.68, duration: 0.65 }}
          style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(13px,2.2vw,17px)', fontWeight: 300, color: 'rgba(238,238,245,0.4)', marginBottom: 'clamp(20px,4vh,36px)', textAlign: 'center' }}>
          Enter your details · your certificate will be generated instantly.
        </motion.p>

        {/* Two-column: Form + Live Preview */}
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'grid', gridTemplateColumns: 'minmax(320px,420px) 1fr', gap: 32, width: '100%', alignItems: 'start' }}>

          {/* ─── Form ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Name field with real-time indicator */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: nameColor, letterSpacing: '0.16em', transition: 'color 0.25s' }}>
                  FULL NAME {hasSheets && <span style={{ fontSize: 7, opacity: 0.7 }}>REQUIRED</span>}
                </label>
                <AnimatePresence mode="wait">
                  {nameStatus === 'found' && (
                    <motion.span key="found" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: ACC, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={10} /> VERIFIED
                    </motion.span>
                  )}
                  {nameStatus === 'notfound' && form.name.trim() && (
                    <motion.span key="notfound" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={10} /> NOT FOUND
                    </motion.span>
                  )}
                  {nameStatus === 'idle' && form.name.trim() && !hasSheets && (
                    <motion.span key="any" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(238,238,245,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Search size={9} /> OPEN ACCESS
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <input
                ref={firstInputRef} value={form.name}
                onChange={set('name')}
                onKeyDown={e => e.key === 'Enter' && canGenerate && onGenerate()}
                placeholder="e.g. Rahul Kumar"
                autoFocus
                style={{
                  ...fieldStyle,
                  borderColor: nameStatus === 'found' ? 'rgba(61,255,160,0.4)' : nameStatus === 'notfound' && form.name.trim() ? 'rgba(255,77,77,0.4)' : 'rgba(255,255,255,0.09)',
                  boxShadow: nameStatus === 'found' ? '0 0 0 3px rgba(61,255,160,0.08)' : nameStatus === 'notfound' && form.name.trim() ? '0 0 0 3px rgba(255,77,77,0.06)' : 'none',
                }}
                onFocus={e => { e.target.style.boxShadow = '0 0 0 4px rgba(61,255,160,0.09)'; }}
                onBlur={e => { e.target.style.boxShadow = nameStatus === 'found' ? '0 0 0 3px rgba(61,255,160,0.08)' : 'none'; }}
              />
            </div>

            {/* Roll Number */}
            <div>
              <label style={{ display: 'block', fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(238,238,245,0.3)', letterSpacing: '0.16em', marginBottom: 6 }}>
                ROLL NUMBER
              </label>
              <input value={form.rollNumber} onChange={set('rollNumber')}
                onKeyDown={e => e.key === 'Enter' && canGenerate && onGenerate()}
                placeholder="e.g. 24A91A0501"
                style={fieldStyle}
                onFocus={e => { e.target.style.borderColor = 'rgba(61,255,160,0.45)'; e.target.style.boxShadow = '0 0 0 4px rgba(61,255,160,0.09)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Year + Department */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(238,238,245,0.3)', letterSpacing: '0.16em', marginBottom: 6 }}>YEAR</label>
                <select value={form.year} onChange={set('year')}
                  style={{ ...fieldStyle, cursor: 'pointer', appearance: 'none' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(61,255,160,0.45)'; e.target.style.boxShadow = '0 0 0 4px rgba(61,255,160,0.09)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}>
                  <option value="" style={{ background: '#0e0e14' }}>Select</option>
                  {['I', 'II', 'III', 'IV', 'V'].map(y => <option key={y} value={y} style={{ background: '#0e0e14' }}>{y} Year</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(238,238,245,0.3)', letterSpacing: '0.16em', marginBottom: 6 }}>DEPARTMENT</label>
                <input value={form.department} onChange={set('department')}
                  onKeyDown={e => e.key === 'Enter' && canGenerate && onGenerate()}
                  placeholder="e.g. Computer Science"
                  style={fieldStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(61,255,160,0.45)'; e.target.style.boxShadow = '0 0 0 4px rgba(61,255,160,0.09)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {rateLimited && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#f59e0b', fontFamily: 'Inter', fontSize: 13, justifyContent: 'center' }}>
                <AlertCircle size={14} /> Too many attempts — wait 30 seconds.
              </motion.div>
            )}

            {/* Not found inline hint - removed: generate in any situation */}

            <motion.button onClick={onGenerate} disabled={!canGenerate}
              whileHover={canGenerate ? { scale: 1.03, boxShadow: `0 0 48px rgba(61,255,160,0.5)` } : {}}
              whileTap={canGenerate ? { scale: 0.97 } : {}}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                padding: 'clamp(14px,2.2vh,18px)',
                background: canGenerate ? `linear-gradient(135deg, ${ACC} 0%, #22c55e 100%)` : 'rgba(255,255,255,0.04)',
                border: 'none', borderRadius: 14,
                color: canGenerate ? '#07070a' : 'rgba(238,238,245,0.2)',
                fontSize: 'clamp(13px,1.8vw,15px)', fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.07em',
                cursor: canGenerate ? 'pointer' : 'not-allowed',
                boxShadow: canGenerate ? `0 0 32px rgba(61,255,160,0.25)` : 'none',
                transition: 'all 0.25s', marginTop: 4,
              }}>
              GENERATE CERTIFICATE <ArrowRight size={16} />
            </motion.button>

            {!hasSheets && (
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(238,238,245,0.2)', textAlign: 'center', letterSpacing: '0.1em' }}>
                OPEN ACCESS — NO VERIFICATION LIST LOADED
              </p>
            )}
          </div>

          {/* ─── Live Certificate Preview ─── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1, duration: 0.7 }}>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(238,238,245,0.28)', letterSpacing: '0.14em', marginBottom: 10, textAlign: 'center' }}>
              LIVE PREVIEW
            </p>
            <div style={{ filter: 'drop-shadow(0 12px 40px rgba(61,255,160,0.12))' }}>
              <CertificateCanvas
                templateUrl={templateUrl}
                fields={templateFields}
                participant={previewParticipant}
                verificationId="SANKALP26-PREVIEW"
                showGlow={false}
              />
            </div>
            <p style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(238,238,245,0.2)', textAlign: 'center', marginTop: 8 }}>
              Updates as you type
            </p>
          </motion.div>

        </motion.div>
      </div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.22 }} transition={{ delay: 2 }}
        style={{ position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)', fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', zIndex: 5 }}>
        ST. PETER'S ENGINEERING COLLEGE · HYDERABAD
      </motion.p>
    </motion.div>
  );
}

/* ─── GENERATING ─── */
function GeneratingStage({ stepIdx, name }: { stepIdx: number; name: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <motion.div initial={{ top: 0 }} animate={{ top: '100%' }} transition={{ duration: 2.4, ease: 'linear', repeat: Infinity }}
        style={{ position: 'absolute', left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent 0%, ${ACC} 40%, ${ACC} 60%, transparent 100%)`, boxShadow: `0 0 18px ${ACC}`, opacity: 0.55, pointerEvents: 'none', zIndex: 5 }} />
      <div style={{ position: 'relative', width: 72, height: 72, marginBottom: 48 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid rgba(61,255,160,0.1)' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid transparent', borderTopColor: ACC, borderRightColor: 'rgba(61,255,160,0.3)', animation: 'spin 0.85s linear infinite', filter: `drop-shadow(0 0 5px ${ACC})` }} />
        <div style={{ position: 'absolute', inset: 16, borderRadius: '50%', border: '1px solid rgba(61,255,160,0.08)', borderTopColor: 'rgba(61,255,160,0.35)', animation: 'spin 1.5s linear infinite reverse' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 6, height: 6, borderRadius: '50%', background: ACC, boxShadow: `0 0 12px ${ACC}` }} />
      </div>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, letterSpacing: '0.14em', color: 'rgba(238,238,245,0.32)', marginBottom: 44 }}>
        <span style={{ color: ACC }}>{name}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'flex-start', minWidth: 'clamp(280px,50vw,360px)' }}>
        {STEPS.map((step, i) => {
          const s = i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'pending';
          return (
            <motion.div key={step.label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07, duration: 0.4 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', marginTop: 4, flexShrink: 0, background: s !== 'pending' ? ACC : 'rgba(255,255,255,0.1)', boxShadow: s === 'active' ? `0 0 14px ${ACC}, 0 0 28px rgba(61,255,160,0.4)` : 'none', transition: 'all 0.5s' }} />
              <div>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: '0.13em', color: s === 'done' ? `rgba(61,255,160,0.55)` : s === 'active' ? ACC : 'rgba(255,255,255,0.14)', transition: 'color 0.5s' }}>
                  {s === 'done' && '✓  '}{step.label}
                </p>
                <AnimatePresence>
                  {s === 'active' && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }}
                      style={{ fontFamily: 'Inter', fontSize: 11, color: `rgba(61,255,160,0.45)`, marginTop: 3 }}>
                      {step.sub}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div style={{ marginTop: 44, width: 'clamp(280px,50vw,360px)', height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
        <motion.div initial={{ width: '0%' }} animate={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ height: '100%', background: `linear-gradient(90deg, rgba(61,255,160,0.4), ${ACC})`, borderRadius: 1 }} />
      </div>
    </motion.div>
  );
}

/* ─── NOT FOUND ─── */
function NotFoundStage({ name, onReset }: { name: string; onReset: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
      <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.08 }}
        style={{ width: 88, height: 88, borderRadius: '50%', background: 'rgba(255,77,77,0.07)', border: '1px solid rgba(255,77,77,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, boxShadow: '0 0 32px rgba(255,77,77,0.15)' }}>
        <span style={{ fontSize: 40 }}>⚠</span>
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(22px,5vw,42px)', fontWeight: 700, color: '#eeeef5', marginBottom: 14 }}>
        Name not found.
      </motion.h2>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <p style={{ fontFamily: 'Inter', fontSize: 15, color: 'rgba(238,238,245,0.42)', marginBottom: 8 }}>
          <span style={{ fontFamily: 'JetBrains Mono', color: '#ff6b6b', background: 'rgba(255,77,77,0.1)', padding: '2px 10px', borderRadius: 4 }}>{name}</span>
          {' '}was not found in the participant list.
        </p>
        <p style={{ fontFamily: 'Inter', fontSize: 13, color: 'rgba(238,238,245,0.28)', marginBottom: 48 }}>
          Double-check your full name spelling and try again.
        </p>
      </motion.div>
      <motion.button onClick={onReset}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '14px 32px', background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, color: '#eeeef5', fontSize: 14, fontFamily: 'Space Grotesk', fontWeight: 600, cursor: 'pointer' }}>
        <RefreshCw size={14} /> Try Again
      </motion.button>
    </motion.div>
  );
}

/* ─── READY ─── */
function ReadyStage({ participant, verificationId, templateUrl, fields, onDownload, dlState }: {
  participant: Participant; verificationId: string;
  templateUrl: string | null; fields: AppState['templateAppreciation']['fields'];
  onDownload: () => void; dlState: 'idle' | 'loading' | 'done';
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(60px,8vh,96px) clamp(16px,4vw,40px)', overflowY: 'auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '0.2em', color: ACC, marginBottom: 28 }}>
        <CheckCircle size={13} style={{ filter: `drop-shadow(0 0 4px ${ACC})` }} /> CERTIFICATE OF APPRECIATION
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.82, y: 24, filter: 'blur(28px)' }} animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: 'min(92vw, 680px)', marginBottom: 36, filter: `drop-shadow(0 0 60px rgba(61,255,160,0.18))` }}>
        <CertificateCanvas templateUrl={templateUrl} fields={fields} participant={participant} verificationId={verificationId} showGlow />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(20px,4vw,36px)', fontWeight: 700, color: '#eeeef5', marginBottom: 6 }}>
          {participant.name}
        </h2>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(238,238,245,0.4)', letterSpacing: '0.1em' }}>
          {participant.rollNumber !== '—' ? participant.rollNumber : ''}
          {participant.branch ? ` · ${participant.branch}` : ''}
          {participant.year ? ` · ${participant.year} Year` : ''}
        </p>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: `rgba(61,255,160,0.4)`, marginTop: 8, letterSpacing: '0.07em' }}>
          {verificationId}
        </p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72 }}>
        <DownloadButton dlState={dlState} onClick={onDownload} accentColor={ACC} />
      </motion.div>
    </motion.div>
  );
}

function DownloadButton({ dlState, onClick, accentColor }: { dlState: 'idle' | 'loading' | 'done'; onClick: () => void; accentColor: string }) {
  return (
    <motion.button onClick={onClick} disabled={dlState !== 'idle'}
      whileHover={dlState === 'idle' ? { scale: 1.05, boxShadow: `0 0 56px ${accentColor}88` } : {}}
      whileTap={dlState === 'idle' ? { scale: 0.97 } : {}}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        padding: 'clamp(15px,2.5vh,21px) clamp(32px,5vw,56px)',
        background: dlState === 'done' ? `rgba(61,255,160,0.08)` : `linear-gradient(135deg, ${accentColor} 0%, #22c55e 100%)`,
        border: dlState === 'done' ? `1px solid rgba(61,255,160,0.38)` : 'none', borderRadius: 16,
        color: dlState === 'done' ? ACC : '#07070a',
        fontSize: 'clamp(13px,2vw,15px)', fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.04em',
        cursor: dlState === 'idle' ? 'pointer' : 'default',
        boxShadow: dlState === 'idle' ? `0 0 36px ${accentColor}55` : 'none',
        transition: 'all 0.35s', minWidth: 250,
      }}>
      {dlState === 'idle' && <><Download size={18} /> Download Certificate</>}
      {dlState === 'loading' && <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(7,7,10,0.2)', borderTop: '2px solid #07070a', animation: 'spin 0.8s linear infinite' }} /> Preparing your certificate...</>}
      {dlState === 'done' && <><CheckCircle size={18} /> Downloaded ✓</>}
    </motion.button>
  );
}

/* ─── THANK YOU ─── */
function ThankYouStage({ participant, onReset, onDownload }: { participant: Participant; onReset: () => void; onDownload: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
      <Confetti />
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'absolute', width: 480, height: 480, borderRadius: '50%', border: `1px solid rgba(61,255,160,0.08)`, boxShadow: `0 0 80px rgba(61,255,160,0.08), inset 0 0 80px rgba(61,255,160,0.04)`, pointerEvents: 'none' }} />
      <div style={{ overflow: 'hidden', marginBottom: 24, position: 'relative' }}>
        <motion.h1 initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(60px, 14vw, 130px)', fontWeight: 700, lineHeight: 0.87, letterSpacing: '-0.04em', color: '#eeeef5' }}>
          Thank<br /><span style={{ color: ACC, filter: `drop-shadow(0 0 24px ${ACC})` }}>You.</span>
        </motion.h1>
      </div>
      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
        style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(15px,2.8vw,21px)', fontWeight: 300, color: 'rgba(238,238,245,0.5)', marginBottom: 10 }}>
        Thank you for being a part of SANKALP'26.
      </motion.p>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}
        style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(13px,2vw,17px)', color: 'rgba(238,238,245,0.28)', marginBottom: 56, maxWidth: 460, fontStyle: 'italic' }}>
        You didn't just participate. You helped us build it.
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.74 }}
        style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 64 }}>
        <motion.button onClick={onDownload} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 26px', background: 'rgba(61,255,160,0.07)', border: `1px solid rgba(61,255,160,0.26)`, borderRadius: 12, color: ACC, fontSize: 13, fontFamily: 'Space Grotesk', fontWeight: 600, cursor: 'pointer' }}>
          <Download size={14} /> Download Again
        </motion.button>
        <motion.button onClick={onReset} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 26px', background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'rgba(238,238,245,0.5)', fontSize: 13, fontFamily: 'Space Grotesk', fontWeight: 600, cursor: 'pointer' }}>
          <HomeIcon size={14} /> Back to Home
        </motion.button>
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.26 }} transition={{ delay: 1.2 }}
        style={{ fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.3)' }}>
        ORIGIN ASSOCIATION · ST. PETER'S ENGINEERING COLLEGE
      </motion.p>
    </motion.div>
  );
}

function Confetti() {
  const items = Array.from({ length: 50 }, (_, i) => ({
    x: Math.random() * 100, delay: Math.random() * 2.2,
    color: [ACC, '#fff', '#22c55e', '#86efac', '#6ee7b7', '#a7f3d0', GOLD][i % 7],
    size: Math.random() * 8 + 2, dur: Math.random() * 2.8 + 2.2, rect: Math.random() > 0.6,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {items.map((d, i) => (
        <motion.div key={i}
          initial={{ y: -10, opacity: 1, rotate: 0 }}
          animate={{ y: '112vh', opacity: 0, rotate: Math.random() > 0.5 ? 420 : -420 }}
          transition={{ duration: d.dur, delay: d.delay, ease: 'easeIn' }}
          style={{ position: 'absolute', top: 0, left: `${d.x}%`, width: d.size, height: d.rect ? d.size * 0.45 : d.size, borderRadius: d.rect ? 1 : '50%', background: d.color, opacity: 0.85 }}
        />
      ))}
    </div>
  );
}

// Unused but referenced via type — keep for future
const _Star = Star;
const _GOLD = GOLD;
void _Star; void _GOLD;

const pause = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
