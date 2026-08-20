import { projectId } from "../../utils/supabase/info";
import type { AppState, CertificateTemplate, VerifySheet, CertificateRecord } from "../store/store";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-eb1c6f0f`;

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

// ── Config ────────────────────────────────────────────────────────────────────

export interface RemoteConfig {
  templateAppreciation: CertificateTemplate;
  templateExcellence: CertificateTemplate;
  updatedAt?: string;
}

export async function fetchConfig(): Promise<RemoteConfig | null> {
  const { data } = await apiFetch("/config");
  return data;
}

export async function saveConfig(cfg: RemoteConfig): Promise<void> {
  await apiFetch("/config", { method: "POST", body: JSON.stringify(cfg) });
}

// ── Verify sheets ─────────────────────────────────────────────────────────────

export async function fetchSheets(): Promise<VerifySheet[]> {
  const { data } = await apiFetch("/sheets");
  return Array.isArray(data) ? data : [];
}

export async function saveSheets(sheets: VerifySheet[]): Promise<void> {
  await apiFetch("/sheets", { method: "POST", body: JSON.stringify(sheets) });
}

// ── Certificates ──────────────────────────────────────────────────────────────

export async function fetchCertificates(): Promise<CertificateRecord[]> {
  const { data } = await apiFetch("/certificates");
  return Array.isArray(data) ? data : [];
}

export async function saveCertificates(records: CertificateRecord[]): Promise<void> {
  await apiFetch("/certificates", { method: "POST", body: JSON.stringify(records) });
}

// ── Settings ──────────────────────────────────────────────────────────────────

export interface RemoteSettings {
  isPublished: boolean;
  adminPassword: string;
  eventDate: string;
  failedAttempts: number;
}

export async function fetchSettings(): Promise<RemoteSettings | null> {
  const { data } = await apiFetch("/settings");
  return data;
}

export async function saveSettings(s: RemoteSettings): Promise<void> {
  await apiFetch("/settings", { method: "POST", body: JSON.stringify(s) });
}

// ── Load full state from remote ───────────────────────────────────────────────

export async function loadRemoteState(): Promise<Partial<AppState>> {
  const [config, sheets, certificates, settings] = await Promise.all([
    fetchConfig().catch(() => null),
    fetchSheets().catch(() => []),
    fetchCertificates().catch(() => []),
    fetchSettings().catch(() => null),
  ]);

  const partial: Partial<AppState> = {};
  if (config) {
    partial.templateAppreciation = config.templateAppreciation;
    partial.templateExcellence = config.templateExcellence;
  }
  if (sheets.length) partial.verifySheets = sheets;
  if (certificates.length) partial.certificates = certificates;
  if (settings) {
    partial.isPublished = settings.isPublished;
    partial.adminPassword = settings.adminPassword;
    partial.eventDate = settings.eventDate;
    partial.failedAttempts = settings.failedAttempts;
  }
  return partial;
}

// ── Save full state to remote ─────────────────────────────────────────────────

export async function saveRemoteState(state: AppState): Promise<void> {
  await Promise.all([
    saveConfig({ templateAppreciation: state.templateAppreciation, templateExcellence: state.templateExcellence }),
    saveSheets(state.verifySheets),
    saveCertificates(state.certificates),
    saveSettings({
      isPublished: state.isPublished,
      adminPassword: state.adminPassword,
      eventDate: state.eventDate,
      failedAttempts: state.failedAttempts,
    }),
  ]);
}
