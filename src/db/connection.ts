import { Database } from 'bun:sqlite';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync } from 'fs';

const STIFLER_DIR = join(homedir(), '.stifler');
const DB_PATH = join(STIFLER_DIR, 'data.db');

let db: Database | null = null;

export function getDbPath(): string {
  return DB_PATH;
}

export function getStiflerDir(): string {
  return STIFLER_DIR;
}

export function isFirstRun(): boolean {
  return !existsSync(DB_PATH);
}

export function getDb(): Database {
  if (db) return db;

  if (!existsSync(STIFLER_DIR)) {
    mkdirSync(STIFLER_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
