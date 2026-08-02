import fs from "node:fs"
import { resolve } from "node:path"
import { randomUUID } from "node:crypto"
import { DatabaseSync } from "node:sqlite"
import { publishFileAtomically } from "../../../files/atomicPublication"
import type { ProjectStateCompatibility } from "../compatibility"
import { createSqliteProjectStateSchema } from "./schema"
import {
  createSqliteProjectStateStoreFromDatabase,
  type SqliteProjectStateStoreFixture,
} from "./store"
import type { SqliteProjectStateIdentity } from "./readToken"

export interface SqliteProjectStatePersistenceHooks {
  readonly backup?: (database: DatabaseSync, target: string) => Promise<void>
  readonly verifySnapshot?: (snapshotPath: string, compatibility: ProjectStateCompatibility) => void | Promise<void>
}

export interface OpenPersistentSqliteProjectStateStoreOptions {
  readonly projectDir: string
  readonly compatibility: ProjectStateCompatibility
  readonly hooks?: SqliteProjectStatePersistenceHooks
  readonly loadSnapshot?: boolean
}

export function projectStateSnapshotPath(projectDir: string): string {
  return resolve(projectDir, ".nkdk", "cache", "project-state.sqlite")
}

export async function openPersistentSqliteProjectStateStore(
  options: OpenPersistentSqliteProjectStateStoreOptions,
): Promise<SqliteProjectStateStoreFixture> {
  const identity = createIdentity()
  let database = new DatabaseSync(identity.databaseName, { timeout: 5_000 })
  let loaded = options.loadSnapshot === false
    ? false
    : await loadCompatibleSnapshot(database, identity, options)
  if (loaded) {
    try {
      initializeLoadedDatabase(database, identity, options.projectDir)
    } catch {
      loaded = false
    }
  }
  if (!loaded) {
    database.close()
    database = new DatabaseSync(identity.databaseName, { timeout: 5_000 })
    createSqliteProjectStateSchema(database, options.compatibility, identity)
    database.prepare("INSERT INTO cache_meta(key, value) VALUES ('project_dir', ?)").run(options.projectDir)
  }

  const target = projectStateSnapshotPath(options.projectDir)
  return createSqliteProjectStateStoreFromDatabase({
    database,
    identity,
    checkpoint: () => checkpointDatabase(database, target, options.compatibility, options.hooks),
  })
}

async function loadCompatibleSnapshot(
  targetDatabase: DatabaseSync,
  identity: SqliteProjectStateIdentity,
  options: OpenPersistentSqliteProjectStateStoreOptions,
): Promise<boolean> {
  let snapshotAttached = false
  try {
    const snapshotPath = projectStateSnapshotPath(options.projectDir)
    targetDatabase.prepare("ATTACH DATABASE ? AS project_state_snapshot").run(snapshotPath)
    snapshotAttached = true
    assertQuickCheck(targetDatabase, "project_state_snapshot")
    assertCompatibility(targetDatabase, options.compatibility, "project_state_snapshot")
    createSqliteProjectStateSchema(targetDatabase, options.compatibility, identity)
    copyAttachedSnapshot(targetDatabase)
    return true
  } catch {
    return false
  } finally {
    if (snapshotAttached) targetDatabase.exec("DETACH DATABASE project_state_snapshot")
  }
}

function copyAttachedSnapshot(database: DatabaseSync): void {
  const tables = database.prepare(`
    SELECT name FROM main.sqlite_schema
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    ORDER BY rowid
  `).all() as unknown as { name: string }[]
  database.exec("PRAGMA foreign_keys = OFF; BEGIN IMMEDIATE")
  try {
    for (const { name } of tables) {
      const table = quoteSqliteIdentifier(name)
      database.exec(`DELETE FROM main.${table}; INSERT INTO main.${table} SELECT * FROM project_state_snapshot.${table}`)
    }
    database.exec("COMMIT; PRAGMA foreign_keys = ON")
  } catch (caught) {
    database.exec("ROLLBACK; PRAGMA foreign_keys = ON")
    throw caught
  }
}

function quoteSqliteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

function initializeLoadedDatabase(
  database: DatabaseSync,
  identity: SqliteProjectStateIdentity,
  projectDir: string,
): void {
  database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = MEMORY; PRAGMA synchronous = NORMAL; BEGIN IMMEDIATE")
  try {
    const update = database.prepare("UPDATE cache_meta SET value = ? WHERE key = ?")
    update.run(identity.stateId, "state_id")
    update.run(identity.databaseName, "database_name")
    update.run(identity.lifecycleNonce, "lifecycle_nonce")
    database.prepare(`
      INSERT INTO cache_meta(key, value) VALUES ('project_dir', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(projectDir)
    database.exec("DELETE FROM read_token_claims; COMMIT")
  } catch (caught) {
    database.exec("ROLLBACK")
    throw caught
  }
}

async function checkpointDatabase(
  database: DatabaseSync,
  target: string,
  compatibility: ProjectStateCompatibility,
  hooks: SqliteProjectStatePersistenceHooks | undefined,
): Promise<void> {
  await publishFileAtomically({
    target,
    writeTemporary: async (temporary) => {
      if (hooks?.backup !== undefined) await hooks.backup(database, temporary)
      else await fs.promises.writeFile(temporary, database.serialize())
    },
    verifyTemporary: async (temporary) => {
      if (hooks?.verifySnapshot !== undefined) await hooks.verifySnapshot(temporary, compatibility)
      else verifySnapshot(temporary, compatibility)
    },
  })
}

function verifySnapshot(path: string, compatibility: ProjectStateCompatibility): void {
  const database = new DatabaseSync(path, { readOnly: true })
  try {
    assertQuickCheck(database)
    assertCompatibility(database, compatibility)
  } finally {
    database.close()
  }
}

type ProjectStateDatabaseSchema = "main" | "project_state_snapshot"

function assertQuickCheck(database: DatabaseSync, schema: ProjectStateDatabaseSchema = "main"): void {
  const row = database.prepare(`PRAGMA ${schema}.quick_check`).get() as Record<string, unknown> | undefined
  if (row?.["quick_check"] !== "ok") throw new Error("SQLite quick_check завершился ошибкой")
}

function assertCompatibility(
  database: DatabaseSync,
  expected: ProjectStateCompatibility,
  schema: ProjectStateDatabaseSchema = "main",
): void {
  const rows = database.prepare(`
    SELECT key, value FROM ${schema}.cache_meta
    WHERE key IN ('schema_version', 'producer_version', 'rules_fingerprint', 'hash_algorithm')
  `).all() as unknown as { key: string; value: string }[]
  const actual = new Map(rows.map(({ key, value }) => [key, value]))
  if (
    actual.get("schema_version") !== String(expected.schemaVersion)
    || actual.get("producer_version") !== expected.producerVersion
    || actual.get("rules_fingerprint") !== expected.rulesFingerprint
    || actual.get("hash_algorithm") !== expected.hashAlgorithm
  ) {
    throw new Error("SQLite-снимок состояния проекта несовместим")
  }
}

function createIdentity(): SqliteProjectStateIdentity {
  return {
    stateId: randomUUID(),
    databaseName: `file:nkdk-project-state-${randomUUID()}?mode=memory&cache=shared`,
    lifecycleNonce: randomUUID(),
  }
}
