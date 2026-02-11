import { getDb } from "./connection.ts";
import { SCHEMA } from "./schema.ts";

export function runMigrations(): void {
  const db = getDb();
  db.run(SCHEMA);
}
