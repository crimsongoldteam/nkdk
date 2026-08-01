import { DatabaseSync, type StatementSync } from "node:sqlite"
import { performance } from "node:perf_hooks"
import type {
  SqliteFirstPassExperimentCounts,
  SqliteFirstPassExperimentFileRecord,
  SqliteFirstPassExperimentStoreStats,
} from "./sqliteFirstPassExperimentProtocol"

const CATEGORY_TABLES = [
  ["object_records", "objectRecords"],
  ["object_index_entries", "objectIndexEntries"],
  ["member_index_entries", "memberIndexEntries"],
  ["value_index_entries", "valueIndexEntries"],
  ["pending_references", "pendingReferences"],
  ["pending_checks", "pendingChecks"],
] as const

type CategoryKey = (typeof CATEGORY_TABLES)[number][1]

export interface SqliteFirstPassExperimentStore {
  append(records: readonly SqliteFirstPassExperimentFileRecord[]): void
  finalize(): SqliteFirstPassExperimentStoreStats
  abort(): void
}

interface StoreStatements {
  file: StatementSync
  validation: StatementSync
  categories: ReadonlyMap<CategoryKey, StatementSync>
}

export function createSqliteFirstPassExperimentStore(): SqliteFirstPassExperimentStore {
  const database = new DatabaseSync(":memory:")
  database.exec(`
    PRAGMA journal_mode = MEMORY;
    PRAGMA synchronous = OFF;
    PRAGMA foreign_keys = ON;

    CREATE TABLE project_files (
      id INTEGER PRIMARY KEY,
      format_version INTEGER NOT NULL,
      component_path TEXT NOT NULL,
      root_project_path TEXT NOT NULL UNIQUE
    ) STRICT;

    CREATE TABLE file_validation (
      file_id INTEGER PRIMARY KEY REFERENCES project_files(id),
      contributed_facts INTEGER NOT NULL,
      diagnostic_count INTEGER NOT NULL,
      diagnostics BLOB NOT NULL
    ) STRICT;

    ${CATEGORY_TABLES.map(
      ([table]) => `CREATE TABLE ${table} (
        file_id INTEGER PRIMARY KEY REFERENCES project_files(id),
        entry_count INTEGER NOT NULL,
        payload BLOB NOT NULL
      ) STRICT;`,
    ).join("\n")}

    BEGIN IMMEDIATE;
  `)

  const statements: StoreStatements = {
    file: database.prepare(`
      INSERT INTO project_files(format_version, component_path, root_project_path)
      VALUES (?, ?, ?)
    `),
    validation: database.prepare(`
      INSERT INTO file_validation(file_id, contributed_facts, diagnostic_count, diagnostics)
      VALUES (?, ?, ?, ?)
    `),
    categories: new Map(
      CATEGORY_TABLES.map(([table, key]) => [
        key,
        database.prepare(`
          INSERT INTO ${table}(file_id, entry_count, payload)
          VALUES (?, ?, ?)
        `),
      ]),
    ),
  }
  let active = true
  let files = 0
  let payloadBytes = 0
  let insertMs = 0

  return {
    append(records) {
      assertActive(active)
      const startedAt = performance.now()
      try {
        for (const record of records) {
          const inserted = statements.file.run(
            record.formatVersion,
            record.componentPath,
            record.rootProjectPath,
          )
          const fileId = inserted.lastInsertRowid
          statements.validation.run(
            fileId,
            record.contributedFacts ? 1 : 0,
            record.counts.diagnostics,
            record.diagnostics,
          )
          for (const [, key] of CATEGORY_TABLES) {
            statements.categories.get(key)!.run(
              fileId,
              record.counts[key],
              record[key],
            )
          }
          files += 1
          payloadBytes += record.bytes
        }
      } finally {
        insertMs += performance.now() - startedAt
      }
    },
    finalize() {
      assertActive(active)
      const commitStartedAt = performance.now()
      database.exec("COMMIT")
      const commitMs = performance.now() - commitStartedAt
      active = false

      const counts = readCounts(database)
      const pageCount = readPragmaNumber(database, "page_count")
      const pageSize = readPragmaNumber(database, "page_size")
      const quickCheckStartedAt = performance.now()
      const quickCheck = database.prepare("PRAGMA quick_check").get() as
        | { quick_check: string }
        | undefined
      const quickCheckMs = performance.now() - quickCheckStartedAt
      database.close()
      if (quickCheck?.quick_check !== "ok") {
        throw new Error(`SQLite quick_check failed: ${quickCheck?.quick_check ?? "no result"}`)
      }

      return {
        files,
        ...counts,
        payloadBytes,
        databaseBytes: pageCount * pageSize,
        insertMs,
        commitMs,
        quickCheckMs,
        quickCheck: "ok",
      }
    },
    abort() {
      if (!active) return
      database.exec("ROLLBACK")
      active = false
      database.close()
    },
  }
}

function readCounts(database: DatabaseSync): SqliteFirstPassExperimentCounts {
  const diagnostics = database
    .prepare("SELECT COALESCE(SUM(diagnostic_count), 0) AS count FROM file_validation")
    .get() as { count: number }

  return {
    diagnostics: diagnostics.count,
    objectRecords: readCategoryCount(database, "object_records"),
    objectIndexEntries: readCategoryCount(database, "object_index_entries"),
    memberIndexEntries: readCategoryCount(database, "member_index_entries"),
    valueIndexEntries: readCategoryCount(database, "value_index_entries"),
    pendingReferences: readCategoryCount(database, "pending_references"),
    pendingChecks: readCategoryCount(database, "pending_checks"),
  }
}

function readCategoryCount(database: DatabaseSync, table: string): number {
  const row = database
    .prepare(`SELECT COALESCE(SUM(entry_count), 0) AS count FROM ${table}`)
    .get() as { count: number }
  return row.count
}

function readPragmaNumber(database: DatabaseSync, pragma: string): number {
  const row = database.prepare(`PRAGMA ${pragma}`).get() as
    | Record<string, number>
    | undefined
  return row === undefined ? 0 : Object.values(row)[0] ?? 0
}

function assertActive(active: boolean): void {
  if (!active) throw new Error("SQLite first-pass experiment store is closed")
}
