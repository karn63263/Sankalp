import QRCode from 'qrcode';

export async function generateQRDataUrl(text: string, size = 120): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    color: { dark: '#1a1a2e', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
}
