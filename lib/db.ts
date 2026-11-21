import path from "path";
import fs from "fs";
import { createRequire } from "module";

export interface Ticket {
  id: string;
  ticket_code: string;
  client_name: string;
  created_at: number;
}

export interface PrintFile {
  id: string;
  ticket_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  copies: number;
  color_mode: "bw" | "color";
  paper_size: "Short (Letter)" | "A4" | "Long (Legal)" | "A3";
  orientation: "portrait" | "landscape";
  double_sided: number; // 0 = single-sided, 1 = back-to-back
  notes?: string | null;
  status: "queued" | "printing" | "done" | "cancelled";
  created_at: number;
  printed_at: number | null;
}

export interface TicketWithFiles extends Ticket {
  files: PrintFile[];
}

interface DatabaseAdapter {
  exec(sql: string): void;
  prepare(sql: string): {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown | undefined;
    run(...params: unknown[]): unknown;
  };
}

let dbInstance: DatabaseAdapter | null = null;

export function getDb(): DatabaseAdapter {
  if (dbInstance) return dbInstance;

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const uploadsDir = path.join(dataDir, "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "printqueue.db");
  const nativeRequire = createRequire(process.cwd() + "/");

  // Check if running under Bun
  // @ts-expect-error Bun global check
  if (typeof Bun !== "undefined") {
    try {
      const { Database } = nativeRequire("bun:sqlite");
      const bDb = new Database(dbPath, { create: true });
      bDb.run("PRAGMA journal_mode = WAL;");
      bDb.run("PRAGMA foreign_keys = ON;");
      dbInstance = {
        exec: (sql: string) => {
          bDb.run(sql);
        },
        prepare: (sql: string) => {
          const stmt = bDb.prepare(sql);
          return {
            all: (...params: unknown[]) => stmt.all(...params) as unknown[],
            get: (...params: unknown[]) => stmt.get(...params) as unknown | undefined,
            run: (...params: unknown[]) => stmt.run(...params),
          };
        },
      };
    } catch (err) {
      console.warn("bun:sqlite init error, falling back to node:sqlite", err);
    }
  }

  // Fallback to Node.js built-in DatabaseSync
  if (!dbInstance) {
    try {
      const { DatabaseSync } = nativeRequire("node:sqlite");
      const nDb = new DatabaseSync(dbPath);
      nDb.exec("PRAGMA journal_mode = WAL;");
      nDb.exec("PRAGMA foreign_keys = ON;");
      dbInstance = {
        exec: (sql: string) => {
          nDb.exec(sql);
        },
        prepare: (sql: string) => {
          const stmt = nDb.prepare(sql);
          return {
            all: (...params: unknown[]) => stmt.all(...params) as unknown[],
            get: (...params: unknown[]) => stmt.get(...params) as unknown | undefined,
            run: (...params: unknown[]) => stmt.run(...params),
          };
        },
      };
    } catch (err) {
      console.error("FATAL: Could not initialize SQLite database via bun:sqlite or node:sqlite", err);
      throw err;
    }
  }

  initSchema(dbInstance);
  return dbInstance;
}

function initSchema(db: DatabaseAdapter) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      ticket_code TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS print_files (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      copies INTEGER DEFAULT 1,
      color_mode TEXT DEFAULT 'bw',
      paper_size TEXT DEFAULT 'A4',
      orientation TEXT DEFAULT 'portrait',
      double_sided INTEGER DEFAULT 0,
      notes TEXT,
      status TEXT DEFAULT 'queued',
      created_at INTEGER NOT NULL,
      printed_at INTEGER,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_print_files_ticket_id ON print_files(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_print_files_status ON print_files(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
  `);

  // Safe incremental migration in case table was created with earlier schema
  const migrations = [
    "ALTER TABLE print_files ADD COLUMN paper_size TEXT DEFAULT 'A4';",
    "ALTER TABLE print_files ADD COLUMN orientation TEXT DEFAULT 'portrait';",
    "ALTER TABLE print_files ADD COLUMN double_sided INTEGER DEFAULT 0;",
    "ALTER TABLE print_files ADD COLUMN notes TEXT;",
  ];

  for (const sql of migrations) {
    try {
      db.exec(sql);
    } catch {
      // Column already exists, safe to ignore
    }
  }
}
