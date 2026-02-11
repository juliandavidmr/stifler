import { getDb } from "../connection.ts";

export function getConfigValue(key: string): string | null {
  const db = getDb();
  const row = db.query("SELECT value FROM config WHERE key = ?").get(key) as {
    value: string;
  } | null;
  return row?.value ?? null;
}

export function setConfigValue(key: string, value: string): void {
  const db = getDb();
  db.query(
    "INSERT INTO config (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?",
  ).run(key, value, Date.now(), value, Date.now());
}

export function deleteConfigValue(key: string): void {
  const db = getDb();
  db.query("DELETE FROM config WHERE key = ?").run(key);
}

export function getAllConfig(): Record<string, string> {
  const db = getDb();
  const rows = db.query("SELECT key, value FROM config").all() as {
    key: string;
    value: string;
  }[];
  const config: Record<string, string> = {};
  for (const row of rows) {
    config[row.key] = row.value;
  }
  return config;
}
