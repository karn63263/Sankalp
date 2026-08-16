export interface Participant {
  rollNumber: string;
  name: string;
  branch: string;
  year: string;
  team: string;
  phone: string;
  certificateType: 'appreciation' | 'excellence';
}

export interface CertificateRecord {
  rollNumber: string;
  verificationId: string;
  generatedAt: string;
  downloadedAt?: string;
}

export interface CertificateField {
  id: string;
  variable: string;
  label: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
  bold: boolean;
}

export interface CertificateTemplate {
  url: string | null;
  templateType: 'image' | 'pdf' | null;
  fields: CertificateField[];
}

export interface VerifySheet {
  id: string;
  filename: string;
  uploadedAt: string;
  columns: string[];
  rows: Record<string, string>[];
}

export interface AppState {
  verifySheets: VerifySheet[];
  participants: Participant[];
  certificates: CertificateRecord[];
  templateAppreciation: CertificateTemplate;
  templateExcellence: CertificateTemplate;
  isPublished: boolean;
  adminPassword: string;
  isAdminLoggedIn: boolean;
  failedAttempts: number;
  eventDate: string;
}

const DEFAULT_FIELDS_APPRECIATION: CertificateField[] = [
  { id: 'f1', variable: '{{NAME}}',        label: 'Name',        x: 42, y: 51, fontSize: 20, fontFamily: 'Inter', color: '#1a1a2e', align: 'left', bold: false },
  { id: 'f2', variable: '{{ROLL_NUMBER}}', label: 'Roll Number', x: 84, y: 51, fontSize: 20, fontFamily: 'Inter', color: '#1a1a2e', align: 'left', bold: false },
  { id: 'f3', variable: '{{YEAR}}',        label: 'Year',        x: 28, y: 58, fontSize: 20, fontFamily: 'Inter', color: '#1a1a2e', align: 'left', bold: false },
  { id: 'f4', variable: '{{BRANCH}}',      label: 'Branch',      x: 72, y: 58, fontSize: 20, fontFamily: 'Inter', color: '#1a1a2e', align: 'left', bold: false },
];

const DEFAULT_FIELDS_EXCELLENCE: CertificateField[] = [
  { id: 'e1', variable: '{{NAME}}',        label: 'Name',        x: 42, y: 51, fontSize: 22, fontFamily: 'Inter', color: '#1a0a00', align: 'left', bold: true  },
  { id: 'e2', variable: '{{ROLL_NUMBER}}', label: 'Roll Number', x: 84, y: 51, fontSize: 20, fontFamily: 'Inter', color: '#1a0a00', align: 'left', bold: false },
  { id: 'e3', variable: '{{YEAR}}',        label: 'Year',        x: 28, y: 58, fontSize: 20, fontFamily: 'Inter', color: '#1a0a00', align: 'left', bold: false },
  { id: 'e4', variable: '{{BRANCH}}',      label: 'Branch',      x: 72, y: 58, fontSize: 20, fontFamily: 'Inter', color: '#1a0a00', align: 'left', bold: false },
];

const STORAGE_KEY = 'sankalp26_state';

function getDefault(): AppState {
  return {
    verifySheets: [],
    participants: [],
    certificates: [],
    templateAppreciation: { url: null, templateType: null, fields: DEFAULT_FIELDS_APPRECIATION },
    templateExcellence: { url: null, templateType: null, fields: DEFAULT_FIELDS_EXCELLENCE },
    isPublished: false,
    adminPassword: 'sankalp2026',
    isAdminLoggedIn: false,
    failedAttempts: 0,
    eventDate: 'August 15, 2026',
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const def = getDefault();

      // Migrate old single-template format
      if (!parsed.templateAppreciation && (parsed.templateUrl !== undefined || parsed.fields !== undefined)) {
        parsed.templateAppreciation = {
          url: parsed.templateUrl ?? null,
          templateType: parsed.templateType ?? null,
          fields: parsed.fields ?? def.templateAppreciation.fields,
        };
        delete parsed.templateUrl; delete parsed.templateType; delete parsed.fields;
      }

      // Migrate verifyData / verifyNames → verifySheets
      if (!parsed.verifySheets) {
        parsed.verifySheets = [];
        if (parsed.verifyData?.rows?.length) {
          parsed.verifySheets.push({
            id: 'migrated',
            filename: 'Imported sheet',
            uploadedAt: new Date().toISOString(),
            columns: parsed.verifyData.columns,
            rows: parsed.verifyData.rows,
          });
        }
        delete parsed.verifyData;
        delete parsed.verifyNames;
      }

      if (parsed.participants) {
        parsed.participants = parsed.participants.map((p: Participant) => ({
          ...p,
          certificateType: p.certificateType ?? 'appreciation',
          phone: p.phone ?? '',
        }));
      }

      return { ...def, ...parsed };
    }
  } catch {}
  return getDefault();
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, isAdminLoggedIn: false }));
}

export function generateVerificationId(rollNumber: string): string {
  const hash = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SANKALP26-${rollNumber}-${hash}`;
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '_');
}
