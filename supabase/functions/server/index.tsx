import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const BASE = "/make-server-eb1c6f0f";

app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

app.get(`${BASE}/health`, (c) => c.json({ status: "ok" }));

// ── Config (certificate templates + field positions) ──────────────────────────
app.get(`${BASE}/config`, async (c) => {
  const value = await kv.get("sankalp26:config");
  return c.json({ data: value ?? null });
});

app.post(`${BASE}/config`, async (c) => {
  const body = await c.req.json();
  await kv.set("sankalp26:config", { ...body, updatedAt: new Date().toISOString() });
  return c.json({ ok: true });
});

// ── Verify sheets (participant Excel data) ────────────────────────────────────
app.get(`${BASE}/sheets`, async (c) => {
  const value = await kv.get("sankalp26:sheets");
  return c.json({ data: value ?? [] });
});

app.post(`${BASE}/sheets`, async (c) => {
  const body = await c.req.json();
  await kv.set("sankalp26:sheets", body);
  return c.json({ ok: true });
});

// ── Certificate records ───────────────────────────────────────────────────────
app.get(`${BASE}/certificates`, async (c) => {
  const value = await kv.get("sankalp26:certificates");
  return c.json({ data: value ?? [] });
});

app.post(`${BASE}/certificates`, async (c) => {
  const body = await c.req.json();
  await kv.set("sankalp26:certificates", body);
  return c.json({ ok: true });
});

// ── App settings (isPublished, adminPassword, eventDate) ──────────────────────
app.get(`${BASE}/settings`, async (c) => {
  const value = await kv.get("sankalp26:settings");
  return c.json({ data: value ?? null });
});

app.post(`${BASE}/settings`, async (c) => {
  const body = await c.req.json();
  await kv.set("sankalp26:settings", body);
  return c.json({ ok: true });
});

Deno.serve(app.fetch);
