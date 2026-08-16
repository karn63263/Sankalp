import { useEffect, useState } from 'react';
import type { Participant, CertificateField } from '../store/store';
import { generateQRDataUrl } from '../utils/qrGenerator';

interface Props {
  templateUrl: string | null;
  fields: CertificateField[];
  participant: Participant;
  verificationId: string;
  /** Called with the canvas container element for drag purposes */
  containerRef?: React.RefObject<HTMLDivElement | null>;
  selectedFieldId?: string | null;
  onFieldClick?: (id: string) => void;
  scale?: number;
  showGlow?: boolean;
}

const VARIABLES: Record<string, (p: Participant, vid: string, date?: string) => string> = {
  '{{NAME}}': p => p.name,
  '{{ROLL_NUMBER}}': p => p.rollNumber,
  '{{BRANCH}}': p => p.branch,
  '{{YEAR}}': p => p.year,
  '{{TEAM}}': p => p.team,
  "{{EVENT_NAME}}": () => "SANKALP'26",
  '{{DATE}}': (_, __, date) => date ?? 'August 15, 2026',
  '{{VERIFICATION_ID}}': (_, vid) => vid,
};

export default function CertificateCanvas({
  templateUrl, fields, participant, verificationId,
  containerRef, selectedFieldId, onFieldClick,
  showGlow = true,
}: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    const verifyUrl = `${window.location.origin}/verify/${verificationId}`;
    generateQRDataUrl(verifyUrl, 160)
      .then(setQrUrl)
      .catch(() => setQrUrl(null));
  }, [verificationId]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1.414',
        background: templateUrl ? 'transparent' : 'linear-gradient(135deg, #f8f6f0, #ffffff)',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: showGlow
          ? '0 0 80px rgba(57,217,138,0.18), 0 40px 80px rgba(0,0,0,0.65)'
          : '0 8px 32px rgba(0,0,0,0.3)',
        userSelect: 'none',
      }}
    >
      {/* Background */}
      {templateUrl ? (
        <img
          src={templateUrl}
          alt="Certificate template"
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
        />
      ) : (
        <DefaultBackground />
      )}

      {/* Dynamic text fields */}
      {fields.map(field => {
        const resolve = VARIABLES[field.variable];
        const text = resolve ? resolve(participant, verificationId) : field.variable;
        if (!text) return null;
        const isSelected = selectedFieldId === field.id;

        return (
          <div
            key={field.id}
            onClick={() => onFieldClick?.(field.id)}
            style={{
              position: 'absolute',
              left: `${field.x}%`,
              top: `${field.y}%`,
              transform: 'translate(-50%, -50%)',
              fontFamily: field.fontFamily,
              fontSize: `${field.fontSize * 0.38}px`,
              fontWeight: field.bold ? 700 : 400,
              color: field.color,
              textAlign: field.align,
              whiteSpace: 'nowrap',
              cursor: onFieldClick ? 'pointer' : 'default',
              padding: '1px 3px',
              outline: isSelected ? '1.5px dashed rgba(57,217,138,0.9)' : '1.5px dashed transparent',
              borderRadius: 2,
              transition: 'outline-color 0.15s',
              lineHeight: 1.2,
              pointerEvents: onFieldClick ? 'auto' : 'none',
            }}
          >
            {text}
          </div>
        );
      })}

      {/* QR Code */}
      {qrUrl && (
        <img
          src={qrUrl}
          alt="Verification QR"
          style={{
            position: 'absolute', bottom: '3%', right: '3%',
            width: '10%', height: 'auto', opacity: 0.85,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

function DefaultBackground() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(135deg, #f8f6f0 0%, #ffffff 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ position: 'absolute', inset: 10, border: '3px solid #1a1a2e' }} />
      <div style={{ position: 'absolute', inset: 16, border: '0.5px solid rgba(26,26,46,0.2)' }} />

      <p style={{ fontFamily: 'JetBrains Mono', fontSize: '1.2cqi', letterSpacing: '0.25em', color: '#9ca3af', marginBottom: '1cqi', position: 'relative' }}>
        CERTIFICATE OF PARTICIPATION
      </p>
      <p style={{ fontFamily: 'Space Grotesk', fontSize: '4cqi', fontWeight: 800, color: '#1a1a2e', position: 'relative', letterSpacing: '-0.02em' }}>
        SANKALP<span style={{ color: '#39d98a' }}>'26</span>
      </p>
      <p style={{ fontFamily: 'Inter', fontSize: '1.3cqi', color: '#9ca3af', marginTop: '1.5cqi', position: 'relative' }}>
        This certificate is proudly presented to
      </p>
      <div style={{ height: '7cqi', position: 'relative' }} />
      <p style={{ fontFamily: 'Inter', fontSize: '1.3cqi', color: '#9ca3af', position: 'relative', textAlign: 'center', padding: '0 10%' }}>
        for successfully participating in the 8-Hour Innovation Sprint
      </p>
      <div style={{ position: 'absolute', bottom: '8%', left: '5%', right: '5%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5cqi' }}>
        <div style={{ width: '100%', height: '0.5px', background: 'rgba(26,26,46,0.15)' }} />
        <p style={{ fontFamily: 'Inter', fontSize: '1cqi', color: '#9ca3af', textAlign: 'center' }}>
          ORIGIN Association · Dept. of Computer Science · St. Peter's Engineering College
        </p>
      </div>
    </div>
  );
}
