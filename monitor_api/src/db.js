import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { localDate } from './dates.js'

const hasColumn = (db, table, column) => db.prepare(`PRAGMA table_info(${table})`).all().some((item) => item.name === column)

function addColumnIfMissing(db, table, column, definition) {
  if (!hasColumn(db, table, column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
}

/** Executa `work` dentro de uma transação; qualquer erro desfaz tudo. */
export function inTransaction(db, work) {
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = work()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

/**
 * Abre (ou cria) o banco em `dataDir` e aplica as migrações. Bancos criados pelas versões
 * anteriores (inclusive os feitos com better-sqlite3) continuam compatíveis: é o mesmo
 * formato de arquivo SQLite.
 */
export function openDatabase(dataDir) {
  mkdirSync(dataDir, { recursive: true })
  const db = new DatabaseSync(path.join(dataDir, 'expense-monitor.db'))
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 3000; PRAGMA synchronous = NORMAL;')

  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      amount REAL NOT NULL CHECK (amount > 0),
      category TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      recurring INTEGER NOT NULL DEFAULT 0,
      recurring_frequency TEXT NOT NULL DEFAULT 'weekly',
      next_charge_date TEXT,
      date TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS income_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL CHECK (amount > 0),
      recurring INTEGER NOT NULL DEFAULT 0,
      recurring_frequency TEXT NOT NULL DEFAULT 'monthly',
      next_credit_date TEXT,
      date TEXT
    );
  `)

  // Migrações de bancos antigos.
  addColumnIfMissing(db, 'expenses', 'recurring_frequency', "TEXT NOT NULL DEFAULT 'weekly'")
  addColumnIfMissing(db, 'expenses', 'next_charge_date', 'TEXT')
  addColumnIfMissing(db, 'income_sources', 'recurring', 'INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing(db, 'income_sources', 'recurring_frequency', "TEXT NOT NULL DEFAULT 'monthly'")
  addColumnIfMissing(db, 'income_sources', 'next_credit_date', 'TEXT')
  if (!hasColumn(db, 'income_sources', 'date')) {
    db.exec('ALTER TABLE income_sources ADD COLUMN date TEXT')
    db.prepare('UPDATE income_sources SET date = ? WHERE date IS NULL').run(localDate())
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date);
    CREATE INDEX IF NOT EXISTS idx_expenses_next_charge ON expenses (next_charge_date) WHERE recurring = 1;
    CREATE INDEX IF NOT EXISTS idx_income_next_credit ON income_sources (next_credit_date) WHERE recurring = 1;
  `)
  return db
}
