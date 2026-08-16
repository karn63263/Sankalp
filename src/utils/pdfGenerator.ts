import jsPDF from 'jspdf';
import type { Participant, CertificateField } from '../store/store';
import { generateQRDataUrl } from './qrGenerator';

export async function generateCertificatePDF(
  participant: Participant,
  templateUrl: string,
  fields: CertificateField[],
  verificationId: string,
  eventDate: string,
): Promise<Blob> {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210;

  // Draw template background
  if (templateUrl) {
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const fmt = templateUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        pdf.addImage(img, fmt, 0, 0, W, H);
        resolve();
      };
      img.onerror = () => {
        // If template fails, draw a basic white cert
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, W, H, 'F');
        resolve();
      };
      img.src = templateUrl;
    });
  } else {
    drawDefaultBackground(pdf, W, H);
  }

  const variables: Record<string, string> = {
    '{{NAME}}': participant.name,
    '{{ROLL_NUMBER}}': participant.rollNumber,
    '{{BRANCH}}': participant.branch || '',
    '{{YEAR}}': participant.year || '',
    '{{TEAM}}': participant.team || '',
    '{{EVENT_NAME}}': "SANKALP'26",
    '{{DATE}}': eventDate,
    '{{VERIFICATION_ID}}': verificationId,
  };

  // Render configured text fields
  for (const field of fields) {
    const text = variables[field.variable] ?? field.variable;
    if (!text) continue;

    const x = (field.x / 100) * W;
    const y = (field.y / 100) * H;
    const ptSize = field.fontSize * 0.75; // px to pt approximation

    pdf.setFontSize(ptSize);

    // Parse hex color
    const hex = field.color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    pdf.setTextColor(r, g, b);

    const style = field.bold ? 'bold' : 'normal';
    pdf.setFont('helvetica', style);

    const align = field.align === 'center' ? 'center' : field.align === 'right' ? 'right' : 'left';
    pdf.text(text, x, y, { align });
  }

  // QR code in bottom-right corner
  try {
    const verifyUrl = `${window.location.origin}/verify/${verificationId}`;
    const qrDataUrl = await generateQRDataUrl(verifyUrl, 200);
    const qrSize = 22;
    pdf.addImage(qrDataUrl, 'PNG', W - qrSize - 10, H - qrSize - 10, qrSize, qrSize);
    pdf.setFontSize(5);
    pdf.setTextColor(120, 120, 140);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Scan to verify', W - 10 - qrSize / 2, H - 6, { align: 'center' });
  } catch { /* QR optional */ }

  return pdf.output('blob');
}

function drawDefaultBackground(pdf: jsPDF, W: number, H: number) {
  pdf.setFillColor(248, 246, 240);
  pdf.rect(0, 0, W, H, 'F');

  // Dark border
  pdf.setDrawColor(26, 26, 46);
  pdf.setLineWidth(3);
  pdf.rect(4, 4, W - 8, H - 8, 'S');

  // Inner hairline
  pdf.setDrawColor(26, 26, 46);
  pdf.setLineWidth(0.3);
  pdf.rect(8, 8, W - 16, H - 16, 'S');

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(26, 26, 46);
  pdf.text("SANKALP'26", W / 2, 38, { align: 'center' });

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 120);
  pdf.text('CERTIFICATE OF PARTICIPATION', W / 2, 46, { align: 'center' });

  pdf.setFontSize(10);
  pdf.text('This certificate is proudly presented to', W / 2, 88, { align: 'center' });

  pdf.setFontSize(9);
  pdf.text('for successfully participating in the 8-Hour Innovation Sprint', W / 2, 128, { align: 'center' });

  // Footer line
  pdf.setDrawColor(200, 200, 210);
  pdf.setLineWidth(0.3);
  pdf.line(30, 175, W - 30, 175);
  pdf.setFontSize(8);
  pdf.setTextColor(140, 140, 160);
  pdf.text('ORIGIN Association · Department of Computer Science · St. Peter\'s Engineering College', W / 2, 181, { align: 'center' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
