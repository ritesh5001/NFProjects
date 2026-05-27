import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;
// Cache the opening promise so concurrent callers all await the same connection
let _dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  if (!_dbPromise) {
    _dbPromise = SQLite.openDatabaseAsync('nfprojects.db').then(db => {
      _db = db;
      return db;
    });
  }
  return _dbPromise;
}

// Run each statement separately — multi-statement execAsync hangs on the web WASM worker
export async function runMigrations(): Promise<void> {
  const db = await getDb();

  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      company TEXT DEFAULT '',
      created_at INTEGER NOT NULL
    );`
  );

  await addColumnIfMissing('clients', 'email', "TEXT DEFAULT ''");
  await addColumnIfMissing('clients', 'phone', "TEXT DEFAULT ''");
  await addColumnIfMissing('clients', 'company', "TEXT DEFAULT ''");
  await addColumnIfMissing('clients', 'created_at', 'INTEGER DEFAULT 0');

  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'website',
      status TEXT NOT NULL DEFAULT 'ongoing',
      client_id TEXT DEFAULT '',
      start_date INTEGER NOT NULL,
      deadline INTEGER NOT NULL,
      budget_quoted REAL DEFAULT 0,
      budget_received REAL DEFAULT 0,
      website_category TEXT DEFAULT '',
      website_platform TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );`
  );

  await addColumnIfMissing('projects', 'website_category', "TEXT DEFAULT ''");
  await addColumnIfMissing('projects', 'website_platform', "TEXT DEFAULT ''");

  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );`
  );

  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      file_uri TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL DEFAULT 'document',
      created_at INTEGER NOT NULL
    );`
  );

  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL UNIQUE,
      body TEXT DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );`
  );
}

async function addColumnIfMissing(table: string, column: string, definition: string): Promise<void> {
  const db = await getDb();
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some(c => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
