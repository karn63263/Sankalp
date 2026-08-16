import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Users, Award, Download, CheckCircle, Search,
  Settings, BarChart2, Database, FileText, X, Lock,
  Zap, Shield, AlertTriangle, Eye, Plus, FlaskConical,
} from 'lucide-react';
import type { AppState, CertificateField, Participant, CertificateTemplate, VerifySheet } from '../store/store';
import { saveState, generateVerificationId } from '../store/store';
import { extractAllData } from '../utils/excelParser';
import CertificateCanvas from '../components/CertificateCanvas';
import { generateCertificatePDF, downloadBlob } from '../utils/pdfGenerator';
import { sanitizeFilename } from '../store/store';

interface AdminProps { state: AppState; setState: (s: AppState) => void; }

type Tab = 'overview' | 'data' | 'winners' | 'template' | 'editor' | 'test' | 'analytics' | 'search';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview',       icon: <BarChart2 size={15} /> },
  { id: 'data',     label: 'Verify List',      icon: <Database size={15} /> },
  { id: 'winners',  label: 'Winners',         icon: <Award size={15} /> },
  { id: 'template', label: 'Templates',       icon: <FileText size={15} /> },
  { id: 'editor',   label: 'Field Editor',    icon: <Settings size={15} /> },
  { id: 'test',     label: 'Test Certificate',icon: <FlaskConical size={15} /> },
  { id: 'analytics',label: 'Analytics',       icon: <BarChart2 size={15} /> },
  { id: 'search',   label: 'Search',          icon: <Search size={15} /> },
];

export default function Admin({ state, setState }: AdminProps) {
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');

  const update = useCallback((patch: Partial<AppState>) => {
    const next = { ...state, ...patch };
    setState(next);
    saveState(next);
  }, [state, setState]);

  if (!state.isAdminLoggedIn) {
    return (
      <LoginScreen
        password={password} setPassword={setPassword} error={loginError}
        onLogin={() => {
          if (password === state.adminPassword) {
            update({ isAdminLoggedIn: true });
            setLoginError('');
          } else {
            setLoginError('Incorrect password.');
            setPassword('');
          }
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07070a', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'rgba(255,255,255,0.018)', borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', padding: '28px 0',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 700, color: '#39d98a', letterSpacing: '0.1em' }}>
            SANKALP'26
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 3, letterSpacing: '0.08em' }}>
            ADMIN CONTROL CENTER
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: state.isPublished ? '#39d98a' : '#f59e0b',
              boxShadow: state.isPublished ? '0 0 6px rgba(57,217,138,0.8)' : 'none',
            }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: state.isPublished ? '#39d98a' : '#f59e0b', letterSpacing: '0.08em' }}>
              {state.isPublished ? 'SYSTEM LIVE' : 'DRAFT MODE'}
            </span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
                background: tab === t.id ? 'rgba(57,217,138,0.09)' : 'transparent',
                border: 'none',
                borderLeft: tab === t.id ? '2px solid #39d98a' : '2px solid transparent',
                color: tab === t.id ? '#39d98a' : 'rgba(240,240,245,0.4)',
                fontSize: 12, fontFamily: 'Inter', fontWeight: tab === t.id ? 600 : 400,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', borderRadius: '0 6px 6px 0',
                marginBottom: 2,
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => update({ isAdminLoggedIn: false })}
            style={{
              width: '100%', padding: '9px', background: 'none',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7,
              color: 'rgba(240,240,245,0.35)', fontSize: 11, fontFamily: 'Inter', cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 'clamp(28px,4vw,48px)', overflowY: 'auto', minHeight: '100vh' }}>
        <AnimatePresence mode="wait">
          {tab === 'overview'  && <OverviewTab  key="ov" state={state} update={update} />}
          {tab === 'data'      && <DataTab      key="dt" state={state} update={update} />}
          {tab === 'winners'   && <WinnersTab   key="wn" state={state} update={update} />}
          {tab === 'template'  && <TemplateTab  key="tp" state={state} update={update} />}
          {tab === 'editor'    && <EditorTab    key="ed" state={state} update={update} />}
          {tab === 'test'      && <TestTab      key="tt" state={state} update={update} />}
          {tab === 'analytics' && <AnalyticsTab key="an" state={state} />}
          {tab === 'search'    && <SearchTab    key="sr" state={state} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ─── LOGIN ─── */
function LoginScreen({ password, setPassword, error, onLogin }: {
  password: string; setPassword: (v: string) => void; error: string; onLogin: () => void;
}) {
  return (
    <div style={{
      minHeight: '100vh', background: '#07070a',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: 400,
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: 'clamp(32px,5vw,52px)', textAlign: 'center',
        }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(57,217,138,0.08)', border: '1px solid rgba(57,217,138,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
        }}>
          <Lock size={26} color="#39d98a" />
        </div>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 700, color: '#f0f0f5', marginBottom: 8 }}>
          Admin Access
        </h1>
        <p style={{ fontFamily: 'Inter', fontSize: 13, color: 'rgba(240,240,245,0.35)', marginBottom: 32 }}>
          SANKALP'26 Certificate Control Center
        </p>

        <input type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onLogin()}
          placeholder="Admin password"
          style={{
            width: '100%', padding: '14px 18px', marginBottom: 8, fontSize: 15,
            fontFamily: 'Inter', background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${error ? 'rgba(255,77,77,0.5)' : 'rgba(255,255,255,0.09)'}`,
            borderRadius: 10, color: '#f0f0f5', outline: 'none',
          }}
        />
        {error && (
          <p style={{ fontFamily: 'Inter', fontSize: 12, color: '#ff6b6b', marginBottom: 8, textAlign: 'left' }}>
            {error}
          </p>
        )}
        <button onClick={onLogin} style={{
          width: '100%', padding: '14px', marginTop: 8,
          background: 'linear-gradient(135deg, #39d98a, #22c55e)',
          border: 'none', borderRadius: 10, color: '#07070a',
          fontSize: 14, fontFamily: 'Space Grotesk', fontWeight: 700, cursor: 'pointer',
        }}>
          Access Control Center →
        </button>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(255,255,255,0.15)', marginTop: 24, letterSpacing: '0.1em' }}>
          DEFAULT PASSWORD: sankalp2026
        </p>
      </motion.div>
    </div>
  );
}

/* ─── SHARED SECTION WRAPPER ─── */
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, color: '#f0f0f5', marginBottom: 4 }}>
          {title}
        </h1>
        {subtitle && <p style={{ fontFamily: 'Inter', fontSize: 13, color: 'rgba(240,240,245,0.35)' }}>{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: 'clamp(18px,3vw,28px)', ...style,
    }}>
      {children}
    </div>
  );
}

/* ─── OVERVIEW ─── */
function OverviewTab({ state, update }: { state: AppState; update: (p: Partial<AppState>) => void }) {
  const [showPublish, setShowPublish] = useState(false);
  const total = state.participants.length;
  const generated = state.certificates.length;
  const downloaded = state.certificates.filter(c => c.downloadedAt).length;
  const remaining = Math.max(0, total - generated);
  const failed = state.failedAttempts;

  const appreciationCount = state.participants.filter(p => p.certificateType !== 'excellence').length;
  const excellenceCount   = state.participants.filter(p => p.certificateType === 'excellence').length;

  const stats = [
    { label: 'Total Participants',   value: total,             color: '#39d98a', icon: <Users size={18} /> },
    { label: 'Appreciation',         value: appreciationCount, color: '#22c55e', icon: <Award size={18} /> },
    { label: 'Excellence (Winners)', value: excellenceCount,   color: '#f5c842', icon: <Award size={18} /> },
    { label: 'Certs Generated',      value: generated,         color: '#86efac', icon: <Download size={18} /> },
    { label: 'Downloaded',           value: downloaded,        color: '#6ee7b7', icon: <Download size={18} /> },
    { label: 'Pending',              value: remaining,         color: '#f59e0b', icon: <Award size={18} /> },
    { label: 'Failed Searches',      value: failed,            color: '#ff6b6b', icon: <AlertTriangle size={18} /> },
  ];

  const totalVerifyRows = (state.verifySheets ?? []).reduce((s, sh) => s + sh.rows.length, 0);
  const checklist = [
    { label: 'Verification sheet uploaded',                 done: totalVerifyRows > 0 },
    { label: 'Appreciation template uploaded',              done: !!state.templateAppreciation.url },
    { label: 'Excellence template uploaded (optional)',     done: !!state.templateExcellence.url },
    { label: 'System published',                            done: state.isPublished },
  ];

  return (
    <Section title="Overview" subtitle="SANKALP'26 Certificate Control Center">
      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}>
            <Card>
              <div style={{ color: s.color, marginBottom: 12 }}>{s.icon}</div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {s.value.toLocaleString()}
              </div>
              <p style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(240,240,245,0.4)', marginTop: 6 }}>{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Checklist */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 600, color: '#f0f0f5', marginBottom: 20 }}>
          System Checklist
        </h3>
        {checklist.map((item, i) => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
            borderBottom: i < checklist.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            <div style={{ color: item.done ? '#39d98a' : 'rgba(255,255,255,0.18)', flexShrink: 0 }}>
              {item.done
                ? <CheckCircle size={17} />
                : <div style={{ width: 17, height: 17, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.18)' }} />
              }
            </div>
            <span style={{ fontFamily: 'Inter', fontSize: 13, color: item.done ? '#f0f0f5' : 'rgba(240,240,245,0.35)' }}>
              {item.label}
            </span>
          </div>
        ))}
      </Card>

      {/* Publish / Unpublish */}
      {!state.isPublished ? (
        <button onClick={() => setShowPublish(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '15px 30px',
            background: 'linear-gradient(135deg, #39d98a, #22c55e)',
            border: 'none', borderRadius: 12, color: '#07070a',
            fontSize: 14, fontFamily: 'Space Grotesk', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 0 28px rgba(57,217,138,0.3)',
          }}>
          <Zap size={17} /> Publish Certificate System →
        </button>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '15px 22px',
          background: 'rgba(57,217,138,0.07)', border: '1px solid rgba(57,217,138,0.25)',
          borderRadius: 12,
        }}>
          <CheckCircle size={18} color="#39d98a" />
          <span style={{ fontFamily: 'Inter', fontSize: 13, color: '#39d98a', fontWeight: 600, flex: 1 }}>
            Certificate system is live
          </span>
          <button onClick={() => update({ isPublished: false })}
            style={{
              padding: '6px 14px', background: 'none',
              border: '1px solid rgba(255,77,77,0.3)', borderRadius: 6,
              color: '#ff6b6b', fontSize: 11, cursor: 'pointer',
            }}>
            Unpublish
          </button>
        </div>
      )}

      {showPublish && (
        <PublishModal total={total}
          onConfirm={() => { update({ isPublished: true }); setShowPublish(false); }}
          onCancel={() => setShowPublish(false)} />
      )}
    </Section>
  );
}

function PublishModal({ total, onConfirm, onCancel }: { total: number; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20,
    }}>
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
        style={{
          background: '#0f0f16', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 20, padding: 'clamp(32px,5vw,48px)', maxWidth: 440, width: '100%', textAlign: 'center',
        }}>
        <Shield size={44} color="#39d98a" style={{ marginBottom: 22 }} />
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, color: '#f0f0f5', marginBottom: 12 }}>
          Publish Certificate System
        </h2>
        <p style={{ fontFamily: 'Inter', fontSize: 13, color: 'rgba(240,240,245,0.45)', marginBottom: 28 }}>
          You're about to make certificates available to all participants.
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.025)', borderRadius: 10, padding: '14px 20px',
          marginBottom: 28, textAlign: 'left',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
            <span style={{ fontFamily: 'Inter', fontSize: 13, color: 'rgba(240,240,245,0.5)' }}>Participants</span>
            <span style={{ fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 700, color: '#f0f0f5' }}>{total.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
            <span style={{ fontFamily: 'Inter', fontSize: 13, color: 'rgba(240,240,245,0.5)' }}>Certificate template</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#39d98a' }}>1 configured</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '13px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10,
            color: 'rgba(240,240,245,0.5)', fontSize: 13, fontFamily: 'Inter', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '13px',
            background: 'linear-gradient(135deg, #39d98a, #22c55e)',
            border: 'none', borderRadius: 10, color: '#07070a',
            fontSize: 13, fontFamily: 'Space Grotesk', fontWeight: 700, cursor: 'pointer',
          }}>
            Publish Certificates →
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── DATA TAB ─── */
function SheetTable({ sheet, query, onRemove }: { sheet: VerifySheet; query: string; onRemove: () => void }) {
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(true);
  const PAGE_SIZE = 50;

  const filtered = query.trim()
    ? sheet.rows.filter(r => Object.values(r).some(v => v.toLowerCase().includes(query.toLowerCase())))
    : sheet.rows;
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
      {/* Sheet header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', cursor: 'pointer', borderBottom: open ? '1px solid rgba(255,255,255,0.06)' : 'none', background: 'rgba(255,255,255,0.015)', transition: 'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: open ? '#39d98a' : 'rgba(240,240,245,0.5)', transition: 'color 0.15s' }}>
            {open ? '▾' : '▸'}
          </span>
          <FileText size={13} color="#39d98a" />
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 600, color: '#f0f0f5' }}>
            {sheet.filename}
          </span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(240,240,245,0.3)', padding: '2px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}>
            {sheet.rows.length.toLocaleString()} rows · {sheet.columns.length} cols
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(240,240,245,0.25)' }}>
            {new Date(sheet.uploadedAt).toLocaleString()}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            style={{ background: 'none', border: '1px solid rgba(255,77,77,0.25)', borderRadius: 5, color: '#ff6b6b', padding: '3px 9px', fontSize: 11, cursor: 'pointer', fontFamily: 'Inter' }}
          >
            Remove
          </button>
        </div>
      </div>

      {open && (
        <>
          <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Inter' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr style={{ background: '#0e0e16' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'rgba(240,240,245,0.3)', fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.07)', width: 36 }}>#</th>
                  {sheet.columns.map(col => (
                    <th key={col} style={{ padding: '8px 12px', textAlign: 'left', color: 'rgba(240,240,245,0.45)', fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                      {col.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr><td colSpan={sheet.columns.length + 1} style={{ padding: '24px', textAlign: 'center', color: 'rgba(240,240,245,0.25)', fontFamily: 'Inter', fontSize: 12 }}>No rows match the search</td></tr>
                ) : pageRows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '7px 12px', color: 'rgba(240,240,245,0.18)', fontFamily: 'JetBrains Mono', fontSize: 10 }}>
                      {page * PAGE_SIZE + i + 1}
                    </td>
                    {sheet.columns.map(col => (
                      <td key={col} style={{ padding: '7px 12px', color: 'rgba(240,240,245,0.75)', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {query && row[col]?.toLowerCase().includes(query.toLowerCase())
                          ? <mark style={{ background: 'rgba(57,217,138,0.22)', color: '#39d98a', borderRadius: 2, padding: '0 2px' }}>{row[col]}</mark>
                          : row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(240,240,245,0.28)' }}>
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()}
              </span>
              <div style={{ display: 'flex', gap: 5 }}>
                {[['← Prev', -1], ['Next →', 1]].map(([label, dir]) => (
                  <button key={label as string}
                    onClick={() => setPage(p => Math.max(0, Math.min(totalPages - 1, p + (dir as number))))}
                    disabled={(dir as number) < 0 ? page === 0 : page === totalPages - 1}
                    style={{ padding: '4px 11px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, color: 'rgba(240,240,245,0.5)', fontSize: 11, cursor: 'pointer', fontFamily: 'Inter' }}>
                    {label as string}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function DataTab({ state, update }: { state: AppState; update: (p: Partial<AppState>) => void }) {
  const [dragging, setDragging] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const sheets = state.verifySheets ?? [];
  const totalRows = sheets.reduce((s, sh) => s + sh.rows.length, 0);

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    setError('');
    setLoadingFiles(arr.map(f => f.name));
    const newSheets: VerifySheet[] = [];
    for (const file of arr) {
      try {
        const data = await extractAllData(file);
        if (data.rows.length === 0) { setError(`"${file.name}" had no data rows.`); continue; }
        newSheets.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          filename: file.name,
          uploadedAt: new Date().toISOString(),
          columns: data.columns,
          rows: data.rows,
        });
      } catch {
        setError(`Failed to read "${file.name}". Make sure it is a valid .xlsx, .xls, or .csv file.`);
      }
    }
    if (newSheets.length) update({ verifySheets: [...sheets, ...newSheets] });
    setLoadingFiles([]);
  };

  const removeSheet = (id: string) =>
    update({ verifySheets: sheets.filter(s => s.id !== id) });

  const clearAll = () => update({ verifySheets: [] });

  return (
    <Section
      title="Verify List"
      subtitle={totalRows > 0
        ? `${sheets.length} sheet${sheets.length !== 1 ? 's' : ''} · ${totalRows.toLocaleString()} total records — certificate generated when any participant input matches any cell`
        : 'Upload one or more Excel sheets. All data is stored as-is for verification.'
      }
    >
      {/* Info banner */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: 'rgba(57,217,138,0.06)', border: '1px solid rgba(57,217,138,0.2)', borderRadius: 10, marginBottom: 20 }}>
        <Shield size={14} color="#39d98a" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(240,240,245,0.5)', lineHeight: 1.65 }}>
          Upload any number of Excel sheets. If <strong style={{ color: '#f0f0f5' }}>any value a participant types</strong> matches any cell across all sheets, the certificate is generated using <strong style={{ color: '#f0f0f5' }}>exactly what they typed</strong>.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${dragging ? 'rgba(57,217,138,0.65)' : 'rgba(255,255,255,0.09)'}`,
          borderRadius: 14, padding: sheets.length > 0 ? '18px 24px' : 'clamp(24px,5vw,48px) 24px',
          textAlign: 'center', cursor: 'pointer',
          background: dragging ? 'rgba(57,217,138,0.05)' : 'transparent',
          transition: 'all 0.2s', marginBottom: 20,
        }}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" multiple style={{ display: 'none' }}
          onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; }} />

        {loadingFiles.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ fontFamily: 'Inter', fontSize: 13, color: '#39d98a' }}>Reading {loadingFiles.length} file{loadingFiles.length > 1 ? 's' : ''}...</p>
            {loadingFiles.map(n => (
              <p key={n} style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(57,217,138,0.5)' }}>{n}</p>
            ))}
          </div>
        ) : sheets.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Upload size={15} color="rgba(57,217,138,0.6)" />
            <p style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(240,240,245,0.35)' }}>
              Drop more files or <span style={{ color: '#39d98a' }}>Browse</span> to add more sheets
            </p>
          </div>
        ) : (
          <>
            <Upload size={26} color="rgba(240,240,245,0.2)" style={{ marginBottom: 10 }} />
            <p style={{ fontFamily: 'Space Grotesk', fontSize: 15, color: 'rgba(240,240,245,0.4)', marginBottom: 4 }}>
              Drop Excel files here or <span style={{ color: '#39d98a' }}>Browse</span>
            </p>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(240,240,245,0.2)', letterSpacing: '0.1em' }}>
              .XLSX · .XLS · .CSV · Multiple files supported
            </p>
          </>
        )}
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,77,77,0.07)', border: '1px solid rgba(255,77,77,0.22)', borderRadius: 8, marginBottom: 16 }}>
          <AlertTriangle size={13} color="#ff6b6b" />
          <span style={{ fontFamily: 'Inter', fontSize: 12, color: '#ff6b6b' }}>{error}</span>
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,107,107,0.6)', cursor: 'pointer', padding: 2 }}><X size={12} /></button>
        </motion.div>
      )}

      {/* Sheets */}
      {sheets.length > 0 && (
        <>
          {/* Global toolbar */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={12} color="rgba(240,240,245,0.3)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search across all sheets..."
                style={{ width: '100%', padding: '8px 12px 8px 30px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f0f0f5', fontSize: 12, fontFamily: 'Inter', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button onClick={clearAll}
              style={{ padding: '7px 14px', background: 'none', border: '1px solid rgba(255,77,77,0.25)', borderRadius: 7, color: '#ff6b6b', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter', whiteSpace: 'nowrap' }}>
              Clear All Sheets
            </button>
          </div>

          <AnimatePresence>
            {sheets.map(sheet => (
              <motion.div key={sheet.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8, height: 0 }}>
                <SheetTable sheet={sheet} query={query} onRemove={() => removeSheet(sheet.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </>
      )}
    </Section>
  );
}

function Chip({ color, icon, label }: { color: string; icon: React.ReactNode; label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '5px 11px',
      background: `${color}12`, border: `1px solid ${color}38`,
      borderRadius: 20, color, fontSize: 11, fontFamily: 'Inter', fontWeight: 600,
    }}>
      {icon} {label}
    </div>
  );
}

/* ─── TEMPLATE TAB — dual templates ─── */
function TemplateUploader({ label, accentColor, tpl, onSet, onClear }: {
  label: string; accentColor: string;
  tpl: AppState['templateAppreciation'];
  onSet: (url: string, tType: 'image' | 'pdf') => void;
  onClear: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => onSet(e.target?.result as string, file.type.includes('pdf') ? 'pdf' : 'image');
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 700, color: '#f0f0f5' }}>{label}</h3>
      </div>
      {!tpl.url ? (
        <div onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          style={{
            border: `2px dashed ${dragging ? `${accentColor}88` : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 12, padding: '36px 24px', textAlign: 'center', cursor: 'pointer',
            background: dragging ? `${accentColor}08` : 'transparent', transition: 'all 0.2s',
          }}>
          <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <FileText size={24} color="rgba(240,240,245,0.2)" style={{ marginBottom: 8 }} />
          <p style={{ fontFamily: 'Space Grotesk', fontSize: 13, color: 'rgba(240,240,245,0.4)', marginBottom: 3 }}>
            Drop or <span style={{ color: accentColor }}>Browse</span>
          </p>
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(240,240,245,0.2)', letterSpacing: '0.1em' }}>PNG · JPG · PDF</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: `1px solid ${accentColor}30` }}>
            {tpl.templateType === 'image'
              ? <img src={tpl.url} alt={label} style={{ width: '100%', display: 'block' }} />
              : <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', textAlign: 'center', color: 'rgba(240,240,245,0.4)', fontFamily: 'Inter', fontSize: 13 }}>PDF template loaded</div>
            }
            <button onClick={onClear} style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, color: accentColor }}>
            <CheckCircle size={13} />
            <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600 }}>Template uploaded</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function TemplateTab({ state, update }: { state: AppState; update: (p: Partial<AppState>) => void }) {
  return (
    <Section title="Certificate Templates" subtitle="Upload templates for each certificate type">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
        <Card>
          <TemplateUploader
            label="Certificate of Appreciation"
            accentColor="#39d98a"
            tpl={state.templateAppreciation}
            onSet={(url, tType) => update({ templateAppreciation: { ...state.templateAppreciation, url, templateType: tType } })}
            onClear={() => update({ templateAppreciation: { ...state.templateAppreciation, url: null, templateType: null } })}
          />
        </Card>
        <Card>
          <TemplateUploader
            label="Certificate of Excellence"
            accentColor="#f5c842"
            tpl={state.templateExcellence}
            onSet={(url, tType) => update({ templateExcellence: { ...state.templateExcellence, url, templateType: tType } })}
            onClear={() => update({ templateExcellence: { ...state.templateExcellence, url: null, templateType: null } })}
          />
          {!state.templateExcellence.url && (
            <p style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(240,240,245,0.25)', marginTop: 12 }}>
              Optional — uses Appreciation template as fallback if not uploaded.
            </p>
          )}
        </Card>
      </div>
    </Section>
  );
}

/* ─── FIELD EDITOR (drag-and-drop) — supports both certificate types ─── */
const VARIABLES = ['{{NAME}}', '{{ROLL_NUMBER}}', '{{BRANCH}}', '{{YEAR}}', '{{TEAM}}', '{{EVENT_NAME}}', '{{DATE}}'];

function EditorTab({ state, update }: { state: AppState; update: (p: Partial<AppState>) => void }) {
  const [certType, setCertType] = useState<'appreciation' | 'excellence'>('appreciation');
  const [selected, setSelected] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingField = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const tpl = certType === 'excellence' ? state.templateExcellence : state.templateAppreciation;
  const accentColor = certType === 'excellence' ? '#f5c842' : '#39d98a';

  const sample: Participant = {
    rollNumber: '24A91A0501', name: 'Rahul Kumar', branch: 'Computer Science', year: 'II', team: 'Team Alpha', phone: '9876543210', certificateType: certType,
  };

  const setTpl = (patch: Partial<typeof tpl>) => {
    if (certType === 'excellence') {
      update({ templateExcellence: { ...state.templateExcellence, ...patch } });
    } else {
      update({ templateAppreciation: { ...state.templateAppreciation, ...patch } });
    }
  };

  const updateField = (id: string, patch: Partial<CertificateField>) =>
    setTpl({ fields: tpl.fields.map(f => f.id === id ? { ...f, ...patch } : f) });

  const addField = () => {
    const id = `f${Date.now()}`;
    const newField: CertificateField = { id, variable: '{{NAME}}', label: 'New Field', x: 50, y: 50, fontSize: 20, fontFamily: 'Inter', color: '#1a1a2e', align: 'center', bold: false };
    setTpl({ fields: [...tpl.fields, newField] });
    setSelected(id);
  };

  const removeField = (id: string) => {
    setTpl({ fields: tpl.fields.filter(f => f.id !== id) });
    if (selected === id) setSelected(null);
  };

  const snap = (v: number) => snapToGrid ? Math.round(v / 5) * 5 : Math.round(v * 10) / 10;

  const onPointerDown = (e: React.PointerEvent, field: CertificateField) => {
    e.preventDefault(); e.stopPropagation();
    setSelected(field.id);
    draggingField.current = { id: field.id, startX: e.clientX, startY: e.clientY, origX: field.x, origY: field.y };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
  };

  const onPointerMove = useCallback((e: PointerEvent) => {
    const df = draggingField.current;
    if (!df || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - df.startX) / rect.width) * 100;
    const dy = ((e.clientY - df.startY) / rect.height) * 100;
    const newX = snap(Math.min(98, Math.max(2, df.origX + dx)));
    const newY = snap(Math.min(98, Math.max(2, df.origY + dy)));
    if (certType === 'excellence') {
      update({ templateExcellence: { ...state.templateExcellence, fields: state.templateExcellence.fields.map(f => f.id === df.id ? { ...f, x: newX, y: newY } : f) } });
    } else {
      update({ templateAppreciation: { ...state.templateAppreciation, fields: state.templateAppreciation.fields.map(f => f.id === df.id ? { ...f, x: newX, y: newY } : f) } });
    }
  }, [state, update, certType, snapToGrid]);

  const onPointerUp = useCallback(() => {
    draggingField.current = null;
    window.removeEventListener('pointermove', onPointerMove);
  }, [onPointerMove]);

  useEffect(() => () => { window.removeEventListener('pointermove', onPointerMove); }, [onPointerMove]);

  const sel = tpl.fields.find(f => f.id === selected);

  const VARS: Record<string, string> = {
    '{{NAME}}': sample.name, '{{ROLL_NUMBER}}': sample.rollNumber,
    '{{BRANCH}}': sample.branch, '{{YEAR}}': sample.year, '{{TEAM}}': sample.team,
    "{{EVENT_NAME}}": "SANKALP'26", '{{DATE}}': state.eventDate,
  };

  return (
    <Section title="Certificate Field Editor" subtitle="Drag text fields to position them — customise font, size, color per field">

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['appreciation', 'excellence'] as const).map(t => (
          <button key={t} onClick={() => { setCertType(t); setSelected(null); }}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 600,
              background: certType === t ? (t === 'excellence' ? '#f5c842' : '#39d98a') : 'rgba(255,255,255,0.05)',
              color: certType === t ? '#07070a' : 'rgba(240,240,245,0.4)',
              transition: 'all 0.2s',
            }}>
            {t === 'appreciation' ? 'Appreciation' : '⭐ Excellence'}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowGrid(g => !g)}
          style={{ padding: '7px 14px', borderRadius: 7, border: `1px solid ${showGrid ? `${accentColor}55` : 'rgba(255,255,255,0.1)'}`, background: showGrid ? `${accentColor}14` : 'transparent', color: showGrid ? accentColor : 'rgba(240,240,245,0.35)', fontSize: 11, fontFamily: 'Inter', cursor: 'pointer', transition: 'all 0.15s' }}>
          ⊞ Grid
        </button>
        <button onClick={() => setSnapToGrid(s => !s)}
          style={{ padding: '7px 14px', borderRadius: 7, border: `1px solid ${snapToGrid ? `${accentColor}55` : 'rgba(255,255,255,0.1)'}`, background: snapToGrid ? `${accentColor}14` : 'transparent', color: snapToGrid ? accentColor : 'rgba(240,240,245,0.35)', fontSize: 11, fontFamily: 'Inter', cursor: 'pointer', transition: 'all 0.15s' }}>
          ◫ Snap
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
        {/* Canvas */}
        <div>
          <div
            ref={containerRef}
            onClick={() => setSelected(null)}
            style={{
              position: 'relative', width: '100%', aspectRatio: '1.414',
              background: '#fff', borderRadius: 10, overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              cursor: 'default', border: `2px solid ${accentColor}44`,
            }}
          >
            {/* Template image or placeholder */}
            {tpl.url ? (
              <img src={tpl.url} alt="cert" draggable={false}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#f8f6f0,#fff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Inter', fontSize: 11, color: '#bbb', textAlign: 'center', padding: '0 20px' }}>Upload a template in the Templates tab first</span>
              </div>
            )}

            {/* Grid overlay */}
            {showGrid && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
                {Array.from({ length: 19 }, (_, i) => (
                  <div key={`v${i}`} style={{ position: 'absolute', left: `${(i + 1) * 5}%`, top: 0, bottom: 0, width: 1, background: 'rgba(100,140,255,0.15)' }} />
                ))}
                {Array.from({ length: 19 }, (_, i) => (
                  <div key={`h${i}`} style={{ position: 'absolute', top: `${(i + 1) * 5}%`, left: 0, right: 0, height: 1, background: 'rgba(100,140,255,0.15)' }} />
                ))}
                {/* Center crosshair */}
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(100,140,255,0.35)' }} />
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(100,140,255,0.35)' }} />
              </div>
            )}

            {/* Draggable fields */}
            {tpl.fields.map(field => {
              const isSelected = selected === field.id;
              const isHovered = hoveredId === field.id && !isSelected;
              return (
                <div
                  key={field.id}
                  onPointerDown={e => onPointerDown(e, field)}
                  onPointerEnter={() => setHoveredId(field.id)}
                  onPointerLeave={() => setHoveredId(null)}
                  onClick={e => { e.stopPropagation(); setSelected(field.id); }}
                  style={{
                    position: 'absolute', left: `${field.x}%`, top: `${field.y}%`,
                    transform: 'translate(-50%,-50%)',
                    fontFamily: field.fontFamily, fontSize: `${field.fontSize * 0.36}px`,
                    fontWeight: field.bold ? 700 : 400, color: field.color,
                    textAlign: field.align, whiteSpace: 'nowrap',
                    cursor: 'grab', padding: '3px 6px',
                    background: isSelected ? `${accentColor}22` : isHovered ? 'rgba(255,255,255,0.25)' : 'transparent',
                    outline: isSelected
                      ? `2px solid ${accentColor}`
                      : isHovered
                        ? `1.5px dashed ${accentColor}88`
                        : `1.5px dashed ${accentColor}33`,
                    borderRadius: 3, userSelect: 'none', lineHeight: 1.2,
                    boxShadow: isSelected ? `0 0 12px ${accentColor}44` : 'none',
                    zIndex: isSelected ? 10 : 2,
                    transition: 'background 0.1s, outline 0.1s, box-shadow 0.1s',
                  }}
                >
                  {VARS[field.variable] ?? field.variable}
                  {/* Position indicator when selected */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
                      background: accentColor, color: '#07070a',
                      fontSize: 8, fontFamily: 'JetBrains Mono', fontWeight: 700,
                      padding: '1px 5px', borderRadius: 3, whiteSpace: 'nowrap', pointerEvents: 'none',
                    }}>
                      {field.x.toFixed(1)}%, {field.y.toFixed(1)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(240,240,245,0.3)', letterSpacing: '0.08em' }}>
              DRAG TO REPOSITION · CLICK TO SELECT
            </p>
            {snapToGrid && (
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: accentColor, letterSpacing: '0.08em' }}>
                SNAP: 5% GRID
              </span>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={addField} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px',
            background: `${accentColor}18`, border: `1px solid ${accentColor}55`,
            borderRadius: 9, color: accentColor, fontSize: 12, fontFamily: 'Inter', fontWeight: 600, cursor: 'pointer',
          }}>
            <Plus size={14} /> Add Text Field
          </button>

          <Card style={{ padding: 14 }}>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(240,240,245,0.35)', letterSpacing: '0.12em', marginBottom: 10 }}>
              FIELDS ({tpl.fields.length})
            </p>
            {tpl.fields.length === 0 && (
              <p style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(240,240,245,0.25)', textAlign: 'center', padding: '12px 0' }}>
                No fields yet — add one above
              </p>
            )}
            {tpl.fields.map(f => (
              <div key={f.id} onClick={() => setSelected(f.id === selected ? null : f.id)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px', borderRadius: 7, cursor: 'pointer', marginBottom: 3,
                  background: selected === f.id ? `${accentColor}18` : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${selected === f.id ? `${accentColor}44` : 'transparent'}`,
                  transition: 'all 0.15s',
                }}>
                <div>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: selected === f.id ? accentColor : 'rgba(240,240,245,0.6)', display: 'block' }}>
                    {f.variable}
                  </span>
                  <span style={{ fontFamily: 'Inter', fontSize: 9, color: 'rgba(240,240,245,0.25)' }}>
                    {f.x.toFixed(0)}%, {f.y.toFixed(0)}% · {f.fontSize}px
                  </span>
                </div>
                <button onClick={e => { e.stopPropagation(); removeField(f.id); }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,77,77,0.45)', cursor: 'pointer', padding: '3px', borderRadius: 4, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ff6b6b')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,77,77,0.45)')}>
                  <X size={11} />
                </button>
              </div>
            ))}
          </Card>

          {sel && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <Card style={{ padding: 14, borderColor: `${accentColor}30` }}>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: accentColor, letterSpacing: '0.12em', marginBottom: 12 }}>
                  ◉ FIELD PROPERTIES
                </p>
                <FP label="Variable">
                  <select value={sel.variable} onChange={e => updateField(sel.id, { variable: e.target.value })} style={is}>
                    {VARIABLES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </FP>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <FP label="X (%)"><input type="number" min={0} max={100} step={snapToGrid ? 5 : 0.5} value={sel.x} onChange={e => updateField(sel.id, { x: +e.target.value })} style={is} /></FP>
                  <FP label="Y (%)"><input type="number" min={0} max={100} step={snapToGrid ? 5 : 0.5} value={sel.y} onChange={e => updateField(sel.id, { y: +e.target.value })} style={is} /></FP>
                </div>
                <FP label="Font Size (px)"><input type="number" min={6} max={120} value={sel.fontSize} onChange={e => updateField(sel.id, { fontSize: +e.target.value })} style={is} /></FP>
                <FP label="Color"><input type="color" value={sel.color} onChange={e => updateField(sel.id, { color: e.target.value })} style={{ ...is, padding: 3, height: 34, cursor: 'pointer' }} /></FP>
                <FP label="Align">
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['left', 'center', 'right'] as const).map(a => (
                      <button key={a} onClick={() => updateField(sel.id, { align: a })}
                        style={{ flex: 1, padding: '6px 4px', borderRadius: 5, border: `1px solid ${sel.align === a ? `${accentColor}55` : 'rgba(255,255,255,0.09)'}`, background: sel.align === a ? `${accentColor}18` : 'rgba(255,255,255,0.03)', color: sel.align === a ? accentColor : 'rgba(240,240,245,0.4)', fontSize: 10, fontFamily: 'Inter', cursor: 'pointer' }}>
                        {a === 'left' ? '⬤ ·' : a === 'center' ? '· ⬤ ·' : '· ⬤'}
                      </button>
                    ))}
                  </div>
                </FP>
                <FP label="Bold">
                  <button onClick={() => updateField(sel.id, { bold: !sel.bold })}
                    style={{ padding: '6px 14px', borderRadius: 5, border: `1px solid ${sel.bold ? `${accentColor}55` : 'rgba(255,255,255,0.09)'}`, background: sel.bold ? `${accentColor}18` : 'rgba(255,255,255,0.03)', color: sel.bold ? accentColor : 'rgba(240,240,245,0.4)', fontSize: 11, fontFamily: 'Inter', fontWeight: sel.bold ? 700 : 400, cursor: 'pointer' }}>
                    B {sel.bold ? '(on)' : '(off)'}
                  </button>
                </FP>
                <button onClick={() => removeField(sel.id)}
                  style={{ width: '100%', marginTop: 6, padding: '8px', background: 'rgba(255,77,77,0.06)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 7, color: '#ff6b6b', fontSize: 11, fontFamily: 'Inter', cursor: 'pointer' }}>
                  Remove Field
                </button>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </Section>
  );
}

const is: React.CSSProperties = {
  width: '100%', padding: '6px 9px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 6, color: '#f0f0f5', fontSize: 11, fontFamily: 'JetBrains Mono', outline: 'none',
};

function FP({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 9 }}>
      <p style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(240,240,245,0.35)', marginBottom: 3 }}>{label}</p>
      {children}
    </div>
  );
}

/* ─── TEST CERTIFICATE ─── */
function TestTab({ state, update }: { state: AppState; update: (p: Partial<AppState>) => void }) {
  const [certType, setCertType] = useState<'appreciation' | 'excellence'>('appreciation');
  const [testRoll, setTestRoll] = useState(state.participants[0]?.rollNumber ?? '');
  const [testParticipant, setTestParticipant] = useState<Participant | null>(state.participants[0] ?? null);
  const [testVid] = useState('SANKALP26-TEST-0000');
  const [generating, setGenerating] = useState(false);
  const [approved, setApproved] = useState(state.isPublished);

  const tpl = certType === 'excellence' ? state.templateExcellence : state.templateAppreciation;
  const accentColor = certType === 'excellence' ? '#f5c842' : '#39d98a';

  const lookupAndSet = (roll: string) => {
    const found = state.participants.find(p => p.rollNumber.toLowerCase() === roll.toLowerCase());
    setTestParticipant(found ?? null);
  };

  const handleDownloadTest = async () => {
    if (!testParticipant) return;
    setGenerating(true);
    try {
      const blob = await generateCertificatePDF(testParticipant, tpl.url ?? '', tpl.fields, testVid, state.eventDate);
      downloadBlob(blob, `TEST_SANKALP26_${sanitizeFilename(testParticipant.name)}.pdf`);
    } catch { alert('PDF generation failed.'); }
    setGenerating(false);
  };

  const sample: Participant = testParticipant ?? {
    rollNumber: testRoll || '24A91A0501', name: testRoll ? 'Not found' : 'Rahul Kumar',
    branch: 'CSE', year: 'II', team: 'Team Alpha', phone: '', certificateType: certType,
  };

  return (
    <Section title="Test Certificate" subtitle="Preview each certificate type before going live">
      {/* Type switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['appreciation', 'excellence'] as const).map(t => (
          <button key={t} onClick={() => setCertType(t)}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 600, background: certType === t ? (t === 'excellence' ? '#f5c842' : '#39d98a') : 'rgba(255,255,255,0.05)', color: certType === t ? '#07070a' : 'rgba(240,240,245,0.4)', transition: 'all 0.2s' }}>
            {t === 'appreciation' ? 'Appreciation' : '⭐ Excellence'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 320px', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={{ width: '100%', maxWidth: 640, border: `2px solid ${accentColor}30`, borderRadius: 12, overflow: 'hidden' }}>
            <CertificateCanvas templateUrl={tpl.url} fields={tpl.fields} participant={sample} verificationId={testVid} showGlow={false} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(240,240,245,0.35)', letterSpacing: '0.12em', marginBottom: 12 }}>TEST WITH ROLL NUMBER</p>
            <input value={testRoll} onChange={e => setTestRoll(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookupAndSet(testRoll)}
              placeholder={state.participants[0]?.rollNumber ?? '24A91A0501'}
              style={{ width: '100%', padding: '10px 12px', marginBottom: 10, fontFamily: 'JetBrains Mono', fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: '#f0f0f5', outline: 'none', letterSpacing: '0.05em' }}
            />
            <button onClick={() => lookupAndSet(testRoll)} style={{ width: '100%', padding: '10px', background: `${accentColor}18`, border: `1px solid ${accentColor}55`, borderRadius: 8, color: accentColor, fontSize: 12, fontFamily: 'Inter', fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}>
              <Eye size={13} style={{ display: 'inline', marginRight: 6 }} /> Preview Certificate
            </button>
            {testParticipant && (
              <div style={{ padding: '10px 12px', background: `${accentColor}08`, borderRadius: 7, border: `1px solid ${accentColor}30` }}>
                <p style={{ fontFamily: 'Inter', fontSize: 12, color: '#f0f0f5', fontWeight: 600 }}>{testParticipant.name}</p>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: accentColor, marginTop: 2 }}>{testParticipant.rollNumber}</p>
                <p style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(240,240,245,0.4)', marginTop: 2 }}>
                  {testParticipant.branch} · Cert: {testParticipant.certificateType}
                </p>
              </div>
            )}
            {testRoll && !testParticipant && (
              <p style={{ fontFamily: 'Inter', fontSize: 12, color: '#ff6b6b', padding: '8px 12px', background: 'rgba(255,77,77,0.07)', borderRadius: 7 }}>Roll number not found</p>
            )}
          </Card>

          <button onClick={handleDownloadTest} disabled={generating || !testParticipant}
            style={{ padding: '12px 20px', background: `${accentColor}18`, border: `1px solid ${accentColor}55`, borderRadius: 10, color: accentColor, fontSize: 13, fontFamily: 'Space Grotesk', fontWeight: 600, cursor: testParticipant ? 'pointer' : 'not-allowed', opacity: testParticipant ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            {generating ? 'Generating...' : <><Download size={15} /> Download Test PDF</>}
          </button>

          <button onClick={() => { setApproved(true); update({ isPublished: true }); }} disabled={approved}
            style={{ padding: '14px 20px', background: approved ? 'rgba(57,217,138,0.07)' : 'linear-gradient(135deg,#39d98a,#22c55e)', border: approved ? '1px solid rgba(57,217,138,0.3)' : 'none', borderRadius: 10, color: approved ? '#39d98a' : '#07070a', fontSize: 13, fontFamily: 'Space Grotesk', fontWeight: 700, cursor: approved ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', boxShadow: approved ? 'none' : '0 0 24px rgba(57,217,138,0.3)' }}>
            {approved ? <><CheckCircle size={15} /> System Live</> : <><Shield size={15} /> Approve &amp; Go Live</>}
          </button>
        </div>
      </div>
    </Section>
  );
}

/* ─── WINNERS TAB — assign certificate types ─── */
function WinnersTab({ state, update }: { state: AppState; update: (p: Partial<AppState>) => void }) {
  const [query, setQuery] = useState('');
  const q = query.toLowerCase();
  const participants = query.length < 1
    ? state.participants
    : state.participants.filter(p => p.rollNumber.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q));

  const appreciationCount = state.participants.filter(p => p.certificateType !== 'excellence').length;
  const excellenceCount   = state.participants.filter(p => p.certificateType === 'excellence').length;

  const toggleType = (rollNumber: string, type: 'appreciation' | 'excellence') => {
    update({ participants: state.participants.map(p => p.rollNumber === rollNumber ? { ...p, certificateType: type } : p) });
  };

  const markAllAs = (type: 'appreciation' | 'excellence') => {
    update({ participants: state.participants.map(p => ({ ...p, certificateType: type })) });
  };

  if (state.participants.length === 0) {
    return (
      <Section title="Winners" subtitle="Mark participants as Excellence award winners">
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ fontFamily: 'Inter', fontSize: 14, color: 'rgba(240,240,245,0.35)' }}>
            No participants loaded yet. Upload data in the Participant Data tab first.
          </p>
        </Card>
      </Section>
    );
  }

  return (
    <Section title="Winners" subtitle="Control who receives Certificate of Appreciation vs Certificate of Excellence">
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(57,217,138,0.1)', border: '1px solid rgba(57,217,138,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={18} color="#39d98a" />
            </div>
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, color: '#39d98a', lineHeight: 1 }}>{appreciationCount}</div>
              <p style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(240,240,245,0.4)', marginTop: 3 }}>Certificate of Appreciation</p>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={18} color="#f5c842" />
            </div>
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, color: '#f5c842', lineHeight: 1 }}>{excellenceCount}</div>
              <p style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(240,240,245,0.4)', marginTop: 3 }}>Certificate of Excellence (Winners)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bulk actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button onClick={() => markAllAs('appreciation')} style={{ padding: '7px 16px', background: 'rgba(57,217,138,0.08)', border: '1px solid rgba(57,217,138,0.25)', borderRadius: 7, color: '#39d98a', fontSize: 11, fontFamily: 'Inter', fontWeight: 600, cursor: 'pointer' }}>
          Mark All as Appreciation
        </button>
        <button onClick={() => markAllAs('excellence')} style={{ padding: '7px 16px', background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.25)', borderRadius: 7, color: '#f5c842', fontSize: 11, fontFamily: 'Inter', fontWeight: 600, cursor: 'pointer' }}>
          Mark All as Excellence
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,240,245,0.3)' }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, roll number, or team..."
          style={{ width: '100%', padding: '11px 14px 11px 40px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, color: '#f0f0f5', fontSize: 13, fontFamily: 'Inter', outline: 'none' }} />
      </div>

      {/* Participant list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {participants.slice(0, 100).map(p => {
          const isExcellence = p.certificateType === 'excellence';
          return (
            <div key={p.rollNumber} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', borderRadius: 10, flexWrap: 'wrap', gap: 10,
              background: isExcellence ? 'rgba(245,200,66,0.04)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isExcellence ? 'rgba(245,200,66,0.2)' : 'rgba(255,255,255,0.05)'}`,
              transition: 'all 0.15s',
            }}>
              <div>
                <p style={{ fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 600, color: '#f0f0f5' }}>{p.name}</p>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: isExcellence ? '#f5c842' : '#39d98a', marginTop: 2 }}>{p.rollNumber}</p>
                {p.team && <p style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(240,240,245,0.35)', marginTop: 1 }}>{p.branch} · {p.team}</p>}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button onClick={() => toggleType(p.rollNumber, 'appreciation')}
                  style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'Inter', fontWeight: 600, background: !isExcellence ? '#39d98a' : 'rgba(255,255,255,0.06)', color: !isExcellence ? '#07070a' : 'rgba(240,240,245,0.4)', transition: 'all 0.15s' }}>
                  Appreciation
                </button>
                <button onClick={() => toggleType(p.rollNumber, 'excellence')}
                  style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'Inter', fontWeight: 600, background: isExcellence ? '#f5c842' : 'rgba(255,255,255,0.06)', color: isExcellence ? '#07070a' : 'rgba(240,240,245,0.4)', transition: 'all 0.15s' }}>
                  ⭐ Excellence
                </button>
              </div>
            </div>
          );
        })}
        {participants.length > 100 && (
          <p style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(240,240,245,0.3)', textAlign: 'center', padding: '12px 0' }}>
            Showing 100 of {participants.length} — use search to narrow results
          </p>
        )}
      </div>
    </Section>
  );
}

/* ─── ANALYTICS ─── */
function AnalyticsTab({ state }: { state: AppState }) {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    return {
      label: d.toLocaleDateString('en', { weekday: 'short' }),
      gen: state.certificates.filter(c => new Date(c.generatedAt).toDateString() === key).length,
      dl: state.certificates.filter(c => c.downloadedAt && new Date(c.downloadedAt).toDateString() === key).length,
    };
  });
  const maxVal = Math.max(...last7.map(d => Math.max(d.gen, d.dl)), 1);

  return (
    <Section title="Analytics" subtitle="Certificate activity overview">
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 600, color: '#f0f0f5', marginBottom: 24 }}>
          Certificate Activity — Last 7 Days
        </h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140 }}>
          {last7.map(d => (
            <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ width: '100%', display: 'flex', gap: 3, alignItems: 'flex-end', height: 110 }}>
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${(d.gen / maxVal) * 100}%` }}
                  transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
                  style={{ flex: 1, background: 'rgba(57,217,138,0.35)', borderRadius: '3px 3px 0 0', minHeight: 2 }} />
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${(d.dl / maxVal) * 100}%` }}
                  transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                  style={{ flex: 1, background: '#39d98a', borderRadius: '3px 3px 0 0', minHeight: 2 }} />
              </div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(240,240,245,0.35)' }}>{d.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
          {[['Generated', 'rgba(57,217,138,0.35)'], ['Downloaded', '#39d98a']].map(([l, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 9, height: 9, background: c, borderRadius: 2 }} />
              <span style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(240,240,245,0.45)' }}>{l}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 600, color: '#f0f0f5', marginBottom: 16 }}>
          Recent Activity
        </h3>
        {state.certificates.length === 0 && (
          <p style={{ fontFamily: 'Inter', fontSize: 13, color: 'rgba(240,240,245,0.3)' }}>No activity yet</p>
        )}
        {state.certificates.slice().reverse().slice(0, 12).map(c => {
          const p = state.participants.find(pp => pp.rollNumber === c.rollNumber);
          return (
            <div key={c.verificationId} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div>
                <p style={{ fontFamily: 'Inter', fontSize: 13, color: '#f0f0f5', fontWeight: 500 }}>{p?.name ?? c.rollNumber}</p>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(240,240,245,0.35)' }}>{c.rollNumber}</p>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <Chip color="#39d98a" icon={<></>} label="Generated" />
                {c.downloadedAt && <Chip color="#22c55e" icon={<></>} label="Downloaded" />}
              </div>
            </div>
          );
        })}
      </Card>
    </Section>
  );
}

/* ─── SEARCH ─── */
function SearchTab({ state }: { state: AppState }) {
  const [query, setQuery] = useState('');
  const q = query.toLowerCase();
  const results = query.length < 2 ? [] : state.participants.filter(p =>
    p.rollNumber.toLowerCase().includes(q) ||
    p.name.toLowerCase().includes(q) ||
    p.team.toLowerCase().includes(q) ||
    (p.phone && p.phone.includes(q))
  ).slice(0, 30);

  return (
    <Section title="Search Participants">
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,240,245,0.3)' }} />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search by roll number, name, or team..."
          style={{
            width: '100%', padding: '14px 16px 14px 44px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 12, color: '#f0f0f5', fontSize: 14, fontFamily: 'Inter', outline: 'none',
          }} />
      </div>

      {results.map(p => {
        const cert = state.certificates.find(c => c.rollNumber === p.rollNumber);
        return (
          <div key={p.rollNumber} style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '14px 18px', marginBottom: 8,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
          }}>
            <div>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, color: '#f0f0f5' }}>{p.name}</p>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#39d98a', marginTop: 2 }}>{p.rollNumber}</p>
              <p style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(240,240,245,0.35)', marginTop: 2 }}>{p.branch} · {p.team}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {cert
                ? <>
                  <Chip color="#39d98a" icon={<CheckCircle size={11} />} label="Generated" />
                  {cert.downloadedAt && <Chip color="#22c55e" icon={<Download size={11} />} label="Downloaded" />}
                </>
                : <Chip color="rgba(240,240,245,0.3)" icon={<></>} label="Pending" />
              }
            </div>
          </div>
        );
      })}
      {query.length >= 2 && results.length === 0 && (
        <p style={{ fontFamily: 'Inter', fontSize: 14, color: 'rgba(240,240,245,0.3)', textAlign: 'center', marginTop: 48 }}>
          No participants found for "{query}"
        </p>
      )}
    </Section>
  );
}
