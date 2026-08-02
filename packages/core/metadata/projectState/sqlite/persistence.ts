import fs from "node:fs"
import { resolve } from "node:path"
import { randomUUID } from "node:crypto"
import { backup as sqliteBackup, DatabaseSync } from "node:sqlite"
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
    : await loadCompatibleSnapshot(database, identity.databaseName, options)
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
  _targetDatabase: DatabaseSync,
  databaseName: string,
  options: OpenPersistentSqliteProjectStateStoreOptions,
): Promise<boolean> {
  let source: DatabaseSync | undefined
  try {
    const bytes = await fs.promises.readFile(projectStateSnapshotPath(options.projectDir))
    source = new DatabaseSync(":memory:")
    source.deserialize(bytes)
    assertQuickCheck(source)
    assertCompatibility(source, options.compatibility)
    await sqliteBackup(source, databaseName, { rate: 2_147_483_647 })
    return true
  } catch {
    return false
  } finally {
    source?.close()
  }
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
      else await sqliteBackup(database, temporary, { rate: 2_147_483_647 })
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

function assertQuickCheck(database: DatabaseSync): void {
  const row = database.prepare("PRAGMA quick_check").get() as Record<string, unknown> | undefined
  if (row?.["quick_check"] !== "ok") throw new Error("SQLite quick_check завершился ошибкой")
}

function assertCompatibility(database: DatabaseSync, expected: ProjectStateCompatibility): void {
  const rows = database.prepare(`
    SELECT key, value FROM cache_meta
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
