import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Home } from 'lucide-react';
import ParticleField from '../components/ParticleField';
import type { AppState } from '../store/store';

interface VerifyProps { state: AppState; }

export default function Verify({ state }: VerifyProps) {
  const { id } = useParams<{ id: string }>();

  const cert = state.certificates.find(c => c.verificationId === id);
  const participant = cert ? state.participants.find(p => p.rollNumber === cert.rollNumber) : null;
  const valid = !!(cert && participant);

  return (
    <div style={{ minHeight: '100vh', background: '#07070a', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ParticleField count={40} />
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '40px 24px', maxWidth: 520 }}>

        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}
          style={{ marginBottom: 32 }}>
          {valid
            ? <CheckCircle size={64} color="#39d98a" style={{ filter: 'drop-shadow(0 0 20px rgba(57,217,138,0.5))' }} />
            : <XCircle size={64} color="#ff4d4d" style={{ filter: 'drop-shadow(0 0 20px rgba(255,77,77,0.4))' }} />
          }
        </motion.div>

        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 40, fontWeight: 700, color: '#f0f0f5', marginBottom: 8 }}>
          {valid ? 'Certificate Verified ✓' : 'Invalid Certificate'}
        </h1>

        {valid && participant ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <p style={{ fontFamily: 'Inter', fontSize: 15, color: 'rgba(240,240,245,0.5)', marginBottom: 40 }}>
              This certificate is authentic and verified.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '32px', textAlign: 'left' }}>
              {[
                ['Name', participant.name],
                ['Roll Number', participant.rollNumber],
                ['Event', "SANKALP'26"],
                ['Branch', participant.branch],
                ['Status', 'Authentic'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'rgba(240,240,245,0.4)', letterSpacing: '0.08em' }}>{label}</span>
                  <span style={{ fontFamily: label === 'Status' ? 'JetBrains Mono' : 'Inter', fontSize: 14, fontWeight: 600, color: label === 'Status' ? '#39d98a' : '#f0f0f5' }}>{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <p style={{ fontFamily: 'Inter', fontSize: 15, color: 'rgba(240,240,245,0.4)', marginBottom: 40 }}>
            This verification ID could not be found. The certificate may be invalid or tampered.
          </p>
        )}

        <motion.a href="/" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 40, padding: '12px 24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'rgba(240,240,245,0.6)', fontSize: 14, fontFamily: 'Space Grotesk', fontWeight: 600, textDecoration: 'none', transition: 'border-color 0.2s' }}>
          <Home size={16} /> Back to Home
        </motion.a>
      </motion.div>
    </div>
  );
}
