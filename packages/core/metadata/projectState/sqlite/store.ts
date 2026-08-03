import { randomUUID } from "node:crypto"
import { DatabaseSync, type StatementSync } from "node:sqlite"
import { BroadcastChannel } from "node:worker_threads"
import type { Diagnostic } from "../../validation/types"
import {
  assertProjectStateFileBaseline,
  assertProjectStateFileHashBatch,
  type ProjectStateReadToken,
} from "../contracts"
import {
  assertProjectStateFileUpdateBatch,
  type ProjectStateDiagnostic,
  type ProjectStateFileIdentity,
  type ProjectStateFileUpdate,
  type ProjectStateFormEntry,
  type ProjectStatePendingDependencyCheck,
  type ProjectStatePendingReference,
  type ProjectStateReferenceEntry,
  type ProjectStateYamlFileUpdate,
} from "../fileUpdate"
import type { ProjectDependencyInputQuery, ProjectStateReadSession } from "../readSession"
import type { YamlPath } from "../../validation/yamlLocations"
import type {
  ProjectDependencyBatch,
  ProjectDependencyBatchQuery,
  ProjectDependencyValidationParams,
  ProjectStateComponentProjection,
  ProjectStateFileChanges,
  ProjectStateStore,
} from "../store"
import type { ProjectStateCompatibility } from "../compatibility"
import type {
  ProjectStateImportFinalFileState,
  ProjectStateImportIndexContribution,
} from "../importSession"
import { decodeJson, decodeOwnerKey, decodeValue, encodeJson, encodeOwnerKey, encodeValue } from "./codec"
import { projectStateFieldEntryFromRow, type SqliteProjectStateFieldEntryRow } from "./fieldEntry"
import { projectStateOwnerFactsFromRows } from "./ownerFacts"
import { createSqliteProjectStateQueryPort, openSqliteProjectStateReadSession } from "./readSession"
import {
  createSqliteProjectStateReadToken,
  sqliteProjectStateLifecycleChannel,
  type SqliteProjectStateIdentity,
} from "./readToken"
import { createSqliteProjectStateSchema } from "./schema"
import {
  readProjectStateDependencyReadiness,
  validateProjectStateDependencyBatch,
  validateProjectStateOwnerBatch,
  validateProjectStateReferenceBatch,
  type ProjectStatePendingOwnerCheck,
  type ProjectStatePendingReferenceCheck,
} from "../dependencyValidation"
import { openProjectStateFileUpdateBatch } from "../binary/contribution"

export interface CreateSqliteProjectStateStoreOptions {
  readonly projectDir: string
  readonly compatibility: ProjectStateCompatibility
}

export interface SqliteProjectStateStoreFixture {
  readonly store: ProjectStateStore
  openReadSession(token: ProjectStateReadToken): ProjectStateReadSession
}

export interface CreateSqliteProjectStateStoreFromDatabaseOptions {
  readonly database: DatabaseSync
  readonly identity: SqliteProjectStateIdentity
  readonly checkpoint?: () => Promise<void>
}

export function createSqliteProjectStateStore(
  options: CreateSqliteProjectStateStoreOptions,
): SqliteProjectStateStoreFixture {
  const identity: SqliteProjectStateIdentity = {
    stateId: randomUUID(),
    databaseName: `file:nkdk-project-state-${randomUUID()}?mode=memory&cache=shared`,
    lifecycleNonce: randomUUID(),
  }
  const database = new DatabaseSync(identity.databaseName, { timeout: 5_000 })
  createSqliteProjectStateSchema(database, options.compatibility, identity)
  database.prepare("INSERT INTO cache_meta(key, value) VALUES ('project_dir', ?)").run(options.projectDir)
  return createSqliteProjectStateStoreFromDatabase({ database, identity })
}

export function createSqliteProjectStateStoreFromDatabase(
  options: CreateSqliteProjectStateStoreFromDatabaseOptions,
): SqliteProjectStateStoreFixture {
  const { database, identity } = options
  createStoreRequestTables(database)
  const lifecycleChannel = new BroadcastChannel(sqliteProjectStateLifecycleChannel(identity))
  lifecycleChannel.unref()

  const store = createStore(
    database,
    identity,
    () => {
      lifecycleChannel.postMessage("close")
      lifecycleChannel.close()
    },
    options.checkpoint,
  )

  return {
    store,
    openReadSession(token) {
      return openSqliteProjectStateReadSession(token, { expectedStateId: identity.stateId })
    },
  }
}

function createStore(
  database: DatabaseSync,
  identity: SqliteProjectStateIdentity,
  closeExternalSessions: () => void,
  checkpoint: (() => Promise<void>) | undefined,
): ProjectStateStore {
  const statements = createStatements(database)
  const queryPort = createSqliteProjectStateQueryPort(database)
  const projectDir = readProjectDir(database)
  let updateActive = false
  let closed = false

  return {
    readFileBaseline(files) {
      assertOpen()
      loadBaselineRequests(database, files)
      const rows = database.prepare(`
        SELECT request.request_index, hashes.hash
        FROM temp.file_baseline_requests request
        LEFT JOIN components component ON component.path = request.component_path COLLATE BINARY
        LEFT JOIN project_files file ON file.project_path = request.project_path COLLATE BINARY
          AND file.component_id = component.id
          AND file.resource_kind = request.resource_kind COLLATE BINARY
          AND file.yaml_role IS request.yaml_role
        LEFT JOIN file_hashes hashes ON hashes.file_id = file.id
        ORDER BY request.request_index
      `).all() as unknown as { request_index: number; hash: Uint8Array | null }[]
      const knownHashBits = new Uint8Array(Math.ceil(files.length / 8))
      const hashBytes = new Uint8Array(files.length * 8)
      for (const { request_index, hash } of rows) {
        if (hash === null) continue
        knownHashBits[Math.floor(request_index / 8)]! |= 1 << (request_index % 8)
        hashBytes.set(hash, request_index * 8)
      }
      const deleted = (database.prepare(`
        SELECT file.project_path, component.path AS component_path, file.resource_kind, file.yaml_role
        FROM project_files file
        JOIN components component ON component.id = file.component_id
        LEFT JOIN temp.file_baseline_requests request
          ON request.project_path = file.project_path COLLATE BINARY
        WHERE request.request_index IS NULL
        ORDER BY file.id
      `).all() as unknown as FileIdentityRow[]).map(fileIdentityFromRow)
      const result = { knownHashBits, hashBytes, deleted }
      assertProjectStateFileBaseline(result, files.length)
      return result
    },
    compareFiles(batch) {
      assertOpen()
      assertProjectStateFileHashBatch(batch)
      loadComparisonRequests(database, batch.files, batch.hashBytes)
      const changed = database.prepare(`
        SELECT r.request_index
        FROM temp.file_comparison_requests r
        LEFT JOIN project_files pf ON pf.project_path = r.project_path COLLATE BINARY
        LEFT JOIN file_hashes h ON h.file_id = pf.id
        WHERE pf.id IS NULL OR h.hash <> r.hash
        ORDER BY r.request_index
      `).all() as unknown as { request_index: number }[]
      const deleted = database.prepare(`
        SELECT pf.project_path, c.path AS component_path, pf.resource_kind, pf.yaml_role
        FROM project_files pf
        JOIN components c ON c.id = pf.component_id
        LEFT JOIN temp.file_comparison_requests r ON r.project_path = pf.project_path COLLATE BINARY
        WHERE r.request_index IS NULL
        ORDER BY pf.id
      `).all() as unknown as FileIdentityRow[]
      return {
        changed: changed.map(({ request_index }) => ({ index: request_index, file: batch.files[request_index]! })),
        deleted: deleted.map(fileIdentityFromRow),
      } satisfies ProjectStateFileChanges
    },
    beginUpdate() {
      assertOpen()
      if (updateActive) throw new Error("Обновление состояния проекта уже начато")
      database.exec("BEGIN IMMEDIATE")
      updateActive = true
    },
    replaceFiles(batch) {
      assertOpen()
      assertUpdateActive()
      if ("bytes" in batch) {
        const encoded = openProjectStateFileUpdateBatch(batch)
        const hashBytes = new Uint8Array(encoded.fileCount * 8)
        const hashView = new DataView(hashBytes.buffer)
        const updates = Array.from({ length: encoded.fileCount }, (_, index) => {
          hashView.setBigUint64(index * 8, encoded.hash(index), false)
          return encoded.update(index)
        })
        batch = { updates, hashBytes }
      }
      assertProjectStateFileUpdateBatch(batch)
      for (let index = 0; index < batch.updates.length; index += 1) {
        replaceFile(statements, batch.updates[index]!, batch.hashBytes, index)
      }
      for (const update of batch.updates) {
        if (update.kind === "yaml") replaceDependencies(statements, update)
      }
    },
    replaceImportIndex(batch) {
      assertOpen()
      assertUpdateActive()
      for (const contribution of batch) replaceImportIndex(statements, contribution)
    },
    registerImportFileIdentities(files) {
      assertOpen()
      assertUpdateActive()
      for (const file of files) registerImportFileIdentity(statements, file)
    },
    replaceImportFinalFileState(batch) {
      assertOpen()
      assertUpdateActive()
      for (let index = 0; index < batch.updates.length; index += 1) {
        replaceImportFinalFileState(statements, batch.updates[index]!, batch.hashBytes, index)
      }
      for (const update of batch.updates) {
        if (update.kind === "yaml") replaceImportFinalDependencies(statements, update)
      }
    },
    deleteFiles(projectPaths) {
      assertOpen()
      assertUpdateActive()
      for (const projectPath of projectPaths) statements.deleteFile.run(projectPath)
    },
    clearImportOutput(componentPaths) {
      assertOpen()
      assertUpdateActive()
      for (const componentPath of componentPaths) statements.deleteComponentFiles.run(componentPath)
    },
    readLocalDiagnostics(params) {
      assertOpen()
      if (params?.mode !== "published") {
        return (database.prepare(`
          SELECT pf.project_path, d.line, d.col, d.severity, d.source, d.message, d.yaml_path
          FROM local_diagnostics d
          JOIN project_files pf ON pf.id = d.source_file_id
          WHERE d.diagnostic_kind = 'local'
          ORDER BY pf.id, d.ordinal, d.id
        `).all() as unknown as DiagnosticRow[]).map(diagnosticFromRow)
      }
      const blockedComponentPaths = readProjectStateDependencyReadiness({ queryPort }).blockedComponentPaths
      return (database.prepare(`
        SELECT pf.project_path, c.path AS component_path, d.diagnostic_kind,
          d.line, d.col, d.severity, d.source, d.message, d.yaml_path
        FROM local_diagnostics d
        JOIN project_files pf ON pf.id = d.source_file_id
        JOIN components c ON c.id = pf.component_id
        ORDER BY pf.id, d.ordinal, d.id
      `).all() as unknown as PublishedDiagnosticRow[])
        .filter(({ component_path, diagnostic_kind }) =>
          blockedComponentPaths.has(component_path) ? diagnostic_kind === "schema" : diagnostic_kind === "local"
        )
        .map(diagnosticFromRow)
    },
    readDependencyCheckBatch(params: ProjectDependencyBatchQuery): ProjectDependencyBatch {
      assertOpen()
      return { results: queryPort.readDependencyInputs(params.requests) }
    },
    validateDependencies(_params: ProjectDependencyValidationParams): readonly Diagnostic[] {
      assertOpen()
      statements.resolveDependencyTargets.run()
      const diagnostics: Diagnostic[] = []
      const readiness = readProjectStateDependencyReadiness({ queryPort })
      for (let offset = 0; ; offset += PENDING_DEPENDENCY_BATCH_SIZE) {
        const batch = readPendingReferenceChecks(database, offset, PENDING_DEPENDENCY_BATCH_SIZE)
        if (batch.length === 0) break
        const checks = batch
          .filter(({ componentPath }) => !readiness.blockedComponentPaths.has(componentPath))
        if (checks.length > 0) diagnostics.push(...validateProjectStateReferenceBatch({ checks, projectDir, queryPort }))
      }
      const validatedOwners = new Set<string>()
      for (let afterSourceFileId = 0; ;) {
        const page = readPendingDependencyCheckPage(database, {
          afterSourceFileId,
          fileBatchSize: PENDING_DEPENDENCY_FILE_BATCH_SIZE,
        })
        if (page.checks.length === 0 || page.nextSourceFileId === undefined) break
        const checks = page.checks
          .filter(({ componentPath }) => !readiness.blockedComponentPaths.has(componentPath))
        const ownerChecks: ProjectStatePendingOwnerCheck[] = []
        for (const check of checks) {
          const key = `${check.componentPath}\u0000${encodeOwnerKey(check.check.owner)}`
          if (validatedOwners.has(key)) continue
          validatedOwners.add(key)
          ownerChecks.push({
            requestId: `owner:${check.requestId}`,
            componentPath: check.componentPath,
            owner: check.check.owner,
          })
        }
        if (ownerChecks.length > 0) {
          diagnostics.push(...validateProjectStateOwnerBatch({ checks: ownerChecks, projectDir, queryPort }))
        }
        if (checks.length > 0) {
          diagnostics.push(...validateProjectStateDependencyBatch({ checks, projectDir, queryPort }))
        }
        afterSourceFileId = page.nextSourceFileId
      }
      return diagnostics.concat(readiness.diagnostics)
    },
    readComponentProjection(componentPath: string): ProjectStateComponentProjection {
      assertOpen()
      return {
        componentPath,
        updates: readComponentUpdates(database, componentPath),
        hashBytes: readComponentHashBytes(database, componentPath),
      }
    },
    createReadToken() {
      assertOpen()
      return createSqliteProjectStateReadToken(identity)
    },
    commitUpdate() {
      assertOpen()
      assertUpdateActive()
      database.exec("COMMIT")
      updateActive = false
    },
    rollbackUpdate() {
      assertOpen()
      assertUpdateActive()
      database.exec("ROLLBACK")
      updateActive = false
    },
    async checkpoint() {
      assertOpen()
      database.exec("PRAGMA optimize")
      await checkpoint?.()
    },
    close() {
      if (closed) return
      if (updateActive) {
        database.exec("ROLLBACK")
        updateActive = false
      }
      database.prepare("UPDATE cache_meta SET value = ? WHERE key = 'lifecycle_nonce'").run(randomUUID())
      closeExternalSessions()
      database.close()
      closed = true
    },
  }

  function assertOpen(): void {
    if (closed) throw new Error("SQLite-хранилище состояния проекта закрыто")
  }

  function assertUpdateActive(): void {
    if (!updateActive) throw new Error("Нет активного обновления состояния проекта")
  }
}

const PENDING_DEPENDENCY_BATCH_SIZE = 2_000
const PENDING_DEPENDENCY_FILE_BATCH_SIZE = 128

function readProjectDir(database: DatabaseSync): string {
  const row = database.prepare("SELECT value FROM cache_meta WHERE key = 'project_dir'").get() as
    | { value: string }
    | undefined
  if (row === undefined) throw new Error("ProjectState не содержит project_dir")
  return row.value
}

function readPendingReferenceChecks(
  database: DatabaseSync,
  offset: number,
  batchSize: number,
): ProjectStatePendingReferenceCheck[] {
  const rows = database.prepare(`
    SELECT p.id, pf.project_path, c.path AS component_path,
      p.canonical_target, p.filter_value, p.yaml_path
    FROM pending_references p
    JOIN project_files pf ON pf.id = p.source_file_id
    JOIN components c ON c.id = pf.component_id
    ORDER BY pf.id, p.ordinal, p.id
    LIMIT ? OFFSET ?
  `).all(batchSize, offset) as unknown as (PendingReferenceRow & {
    id: number
    project_path: string
    component_path: string
  })[]
  return rows.map((row) => {
    const payload = decodeValue<{
      target: ProjectStatePendingReference["target"]
      constraint: ProjectStatePendingReference["constraint"]
    }>(row.filter_value)
    return {
      requestId: `reference:${row.id}`,
      componentPath: row.component_path,
      reference: {
        filePath: row.project_path,
        yamlPath: decodeJson<YamlPath>(row.yaml_path),
        canonical: row.canonical_target,
        ...payload,
      },
    }
  })
}

export function readPendingDependencyCheckPage(
  database: DatabaseSync,
  params: { readonly afterSourceFileId: number; readonly fileBatchSize: number },
): { readonly checks: readonly ProjectDependencyInputQuery[]; readonly nextSourceFileId?: number } {
  const rows = database.prepare(`
    WITH batch_files AS (
      SELECT source_file_id
      FROM pending_dependency_checks
      WHERE check_kind = 'dataPath' AND source_file_id > ?
      GROUP BY source_file_id
      ORDER BY source_file_id
      LIMIT ?
    )
    SELECT p.id, p.source_file_id, pf.project_path, c.path AS component_path, p.payload_json
    FROM pending_dependency_checks p
    JOIN batch_files batch ON batch.source_file_id = p.source_file_id
    JOIN project_files pf ON pf.id = p.source_file_id
    JOIN components c ON c.id = pf.component_id
    WHERE p.check_kind = 'dataPath'
    ORDER BY pf.id, p.ordinal, p.id
  `).all(params.afterSourceFileId, params.fileBatchSize) as unknown as {
    id: number
    source_file_id: number
    project_path: string
    component_path: string
    payload_json: string
  }[]
  return {
    checks: rows.map((row) => ({
      requestId: `dependency:${row.id}`,
      projectPath: row.project_path,
      componentPath: row.component_path,
      check: decodeJson<ProjectStatePendingDependencyCheck>(row.payload_json),
    })),
    ...(rows.length === 0 ? {} : { nextSourceFileId: rows[rows.length - 1]!.source_file_id }),
  }
}

interface StoreStatements {
  readonly insertComponent: StatementSync
  readonly selectComponent: StatementSync
  readonly upsertFile: StatementSync
  readonly insertFile: StatementSync
  readonly selectFile: StatementSync
  readonly selectFileIdentity: StatementSync
  readonly deleteFile: StatementSync
  readonly deleteComponentFiles: StatementSync
  readonly deleteValidation: StatementSync
  readonly deleteHash: StatementSync
  readonly deleteDiagnostics: StatementSync
  readonly deleteReferences: StatementSync
  readonly deletePendingReferences: StatementSync
  readonly deleteOwnerFacts: StatementSync
  readonly deleteFields: StatementSync
  readonly deleteForms: StatementSync
  readonly deletePendingChecks: StatementSync
  readonly deleteDependencies: StatementSync
  readonly insertHash: StatementSync
  readonly insertValidation: StatementSync
  readonly insertDiagnostic: StatementSync
  readonly insertReference: StatementSync
  readonly insertPendingReference: StatementSync
  readonly insertOwnerFact: StatementSync
  readonly insertField: StatementSync
  readonly insertForm: StatementSync
  readonly insertPendingCheck: StatementSync
  readonly insertDependency: StatementSync
  readonly resolveDependencyTargets: StatementSync
}

function createStatements(database: DatabaseSync): StoreStatements {
  return {
    insertComponent: database.prepare("INSERT OR IGNORE INTO components(path) VALUES (?)"),
    selectComponent: database.prepare("SELECT id FROM components WHERE path = ? COLLATE BINARY"),
    upsertFile: database.prepare(`
      INSERT INTO project_files(project_path, component_id, resource_kind, yaml_role)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(project_path) DO UPDATE SET
        component_id = excluded.component_id,
        resource_kind = excluded.resource_kind,
        yaml_role = excluded.yaml_role
    `),
    insertFile: database.prepare(`
      INSERT INTO project_files(project_path, component_id, resource_kind, yaml_role)
      VALUES (?, ?, ?, ?)
    `),
    selectFile: database.prepare("SELECT id FROM project_files WHERE project_path = ? COLLATE BINARY"),
    selectFileIdentity: database.prepare(`
      SELECT pf.id, c.path AS component_path, pf.resource_kind, pf.yaml_role
      FROM project_files pf
      JOIN components c ON c.id = pf.component_id
      WHERE pf.project_path = ? COLLATE BINARY
    `),
    deleteFile: database.prepare("DELETE FROM project_files WHERE project_path = ? COLLATE BINARY"),
    deleteComponentFiles: database.prepare(`
      DELETE FROM project_files
      WHERE component_id = (SELECT id FROM components WHERE path = ? COLLATE BINARY)
    `),
    deleteValidation: database.prepare("DELETE FROM file_validation_results WHERE file_id = ?"),
    deleteHash: database.prepare("DELETE FROM file_hashes WHERE file_id = ?"),
    deleteDiagnostics: database.prepare("DELETE FROM local_diagnostics WHERE source_file_id = ?"),
    deleteReferences: database.prepare("DELETE FROM reference_entries WHERE source_file_id = ?"),
    deletePendingReferences: database.prepare("DELETE FROM pending_references WHERE source_file_id = ?"),
    deleteOwnerFacts: database.prepare("DELETE FROM owner_facts WHERE source_file_id = ?"),
    deleteFields: database.prepare("DELETE FROM field_entries WHERE source_file_id = ?"),
    deleteForms: database.prepare("DELETE FROM form_entries WHERE source_file_id = ?"),
    deletePendingChecks: database.prepare("DELETE FROM pending_dependency_checks WHERE source_file_id = ?"),
    deleteDependencies: database.prepare("DELETE FROM file_dependencies WHERE source_file_id = ?"),
    insertHash: database.prepare("INSERT INTO file_hashes(file_id, hash) VALUES (?, substr(?, ?, 8))"),
    insertValidation: database.prepare(`
      INSERT INTO file_validation_results(file_id, checked, schema_ready, contributed_facts)
      VALUES (?, 1, ?, ?)
    `),
    insertDiagnostic: database.prepare(`
      INSERT INTO local_diagnostics(
        source_file_id, diagnostic_kind, ordinal, severity, source, message, line, col, yaml_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    insertReference: database.prepare(`
      INSERT INTO reference_entries(
        source_file_id, ordinal, entry_kind, canonical_key, owner_key, member_key, value_key, details_value, yaml_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
    `),
    insertPendingReference: database.prepare(`
      INSERT INTO pending_references(
        source_file_id, ordinal, canonical_target, filter_kind, filter_value, line, col, yaml_path
      ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)
    `),
    insertOwnerFact: database.prepare(`
      INSERT INTO owner_facts(source_file_id, ordinal, owner_key, fact_kind, fact_key, fact_value)
      VALUES (?, ?, ?, ?, ?, ?)
    `),
    insertField: database.prepare(`
      INSERT INTO field_entries(
        source_file_id, ordinal, owner_key, field_kind, field_name, type_key,
        target_name, source_collection, parent_name, table_info, table_has_columns
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    insertForm: database.prepare(`
      INSERT INTO form_entries(
        source_file_id, ordinal, owner_key, form_key, source_kind, source_value
      ) VALUES (?, ?, ?, ?, ?, ?)
    `),
    insertPendingCheck: database.prepare(`
      INSERT INTO pending_dependency_checks(
        source_file_id, ordinal, check_kind, payload_json, line, col, yaml_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `),
    insertDependency: database.prepare(`
      INSERT INTO file_dependencies(
        source_file_id, target_file_id, ordinal, dependency_kind, dependency_key
      ) VALUES (?, ?, ?, 'reference', ?)
    `),
    resolveDependencyTargets: database.prepare(`
      UPDATE file_dependencies AS dependency
      SET target_file_id = (
        SELECT reference.source_file_id
        FROM reference_entries reference
        JOIN project_files source ON source.id = dependency.source_file_id
        JOIN components source_component ON source_component.id = source.component_id
        JOIN project_files target ON target.id = reference.source_file_id
        JOIN components target_component ON target_component.id = target.component_id
        WHERE reference.canonical_key = dependency.dependency_key COLLATE BINARY
          AND (
            target_component.id = source_component.id
            OR (
              instr(target_component.path, '/') = 0
              AND target_component.id <> source_component.id
            )
          )
        ORDER BY CASE WHEN target_component.id = source_component.id THEN 0 ELSE 1 END,
          reference.source_file_id
        LIMIT 1
      )
    `),
  }
}

function replaceFile(
  statements: StoreStatements,
  update: ProjectStateFileUpdate,
  hashBytes: Uint8Array,
  batchIndex: number,
): void {
  const { fileId, existed } = upsertProjectFile(statements, update)
  if (existed) deleteFileContribution(statements, fileId)
  statements.insertHash.run(fileId, hashBytes, batchIndex * 8 + 1)
  if (update.kind === "resource") return

  insertIndexContribution(statements, fileId, update)
  insertFinalYamlState(statements, fileId, update)
}

function insertIndexContribution(
  statements: StoreStatements,
  fileId: number,
  contribution: Pick<ProjectStateYamlFileUpdate, "references" | "owners" | "fields" | "forms">,
): void {
  contribution.references.forEach((entry, ordinal) => {
    statements.insertReference.run(
      fileId,
      ordinal,
      entry.kind,
      entry.canonical,
      entry.kind === "object" ? entry.canonical : null,
      entry.kind === "member" ? entry.canonical : null,
      entry.kind === "value" ? entry.canonical : null,
      entry.details === undefined ? null : encodeValue(entry.details),
    )
  })
  let ownerOrdinal = 0
  for (const { owner, facts } of contribution.owners) {
    const entries = Object.entries(facts)
    if (entries.length === 0) {
      statements.insertOwnerFact.run(fileId, ownerOrdinal++, encodeOwnerKey(owner), "owner", "", null)
      continue
    }
    for (const [factKey, factValue] of entries) {
      statements.insertOwnerFact.run(
        fileId,
        ownerOrdinal++,
        encodeOwnerKey(owner),
        "property",
        factKey,
        encodeValue(factValue),
      )
    }
  }
  contribution.fields.forEach((entry, ordinal) => {
    statements.insertField.run(
      fileId,
      ordinal,
      encodeOwnerKey(entry.owner),
      entry.kind,
      entry.name,
      encodeValue(entry.typeInfo),
      entry.targetName ?? null,
      entry.sourceCollection ?? null,
      entry.parentName ?? null,
      entry.table === undefined ? null : encodeValue(entry.table),
      entry.tableHasColumns === undefined ? null : entry.tableHasColumns ? 1 : 0,
    )
  })
  contribution.forms.forEach((entry, ordinal) => {
    statements.insertForm.run(
      fileId,
      ordinal,
      encodeOwnerKey(entry.owner),
      entry.kind === "root" ? entry.name : `${entry.tablePath}.${entry.name}`,
      entry.kind === "root" ? entry.source.kind : "additionalColumn",
      encodeValue(entry),
    )
  })
}

function replaceImportIndex(
  statements: StoreStatements,
  contribution: ProjectStateImportIndexContribution,
): void {
  const fileId = registerImportFileIdentity(statements, contribution)
  statements.deleteReferences.run(fileId)
  statements.deleteOwnerFacts.run(fileId)
  statements.deleteFields.run(fileId)
  statements.deleteForms.run(fileId)
  insertIndexContribution(statements, fileId, contribution)
}

function replaceImportFinalFileState(
  statements: StoreStatements,
  update: ProjectStateImportFinalFileState,
  hashBytes: Uint8Array,
  batchIndex: number,
): void {
  const fileId = requireImportFileIdentity(statements, update)
  statements.deleteHash.run(fileId)
  statements.deleteValidation.run(fileId)
  statements.deleteDiagnostics.run(fileId)
  statements.deletePendingReferences.run(fileId)
  statements.deletePendingChecks.run(fileId)
  statements.deleteDependencies.run(fileId)
  statements.insertHash.run(fileId, hashBytes, batchIndex * 8 + 1)
  if (update.kind === "resource") return
  insertFinalYamlState(statements, fileId, update)
}

interface StoredFileIdentityRow {
  readonly id: number
  readonly component_path: string
  readonly resource_kind: "yaml" | "resource"
  readonly yaml_role: ProjectStateImportIndexContribution["yamlRole"] | null
}

function registerImportFileIdentity(
  statements: StoreStatements,
  file: ProjectStateFileIdentity,
): number {
  const existing = statements.selectFileIdentity.get(file.projectPath) as StoredFileIdentityRow | undefined
  if (existing !== undefined) {
    assertMatchingImportIdentity(existing, file)
    return existing.id
  }
  statements.insertComponent.run(file.componentPath)
  const componentId = integerId(statements.selectComponent.get(file.componentPath))
  statements.insertFile.run(file.projectPath, componentId, file.resourceKind, file.yamlRole ?? null)
  return integerId(statements.selectFile.get(file.projectPath))
}

function requireImportFileIdentity(
  statements: StoreStatements,
  file: ProjectStateFileIdentity,
): number {
  const existing = statements.selectFileIdentity.get(file.projectPath) as StoredFileIdentityRow | undefined
  if (existing === undefined) throw new Error(`Final import identity не зарегистрирована: ${file.projectPath}`)
  assertMatchingImportIdentity(existing, file)
  return existing.id
}

function assertMatchingImportIdentity(existing: StoredFileIdentityRow, file: ProjectStateFileIdentity): void {
  const yamlRole = file.yamlRole ?? null
  if (existing.component_path !== file.componentPath
    || existing.resource_kind !== file.resourceKind
    || existing.yaml_role !== yamlRole) {
    throw new Error(`Final import identity не совпадает для ${file.projectPath}`)
  }
}

function replaceImportFinalDependencies(
  statements: StoreStatements,
  update: Extract<ProjectStateImportFinalFileState, { kind: "yaml" }>,
): void {
  insertDependencies(statements, update)
}

function upsertProjectFile(
  statements: StoreStatements,
  file: {
    readonly projectPath: string
    readonly componentPath: string
    readonly resourceKind: "yaml" | "resource"
    readonly yamlRole?: ProjectStateImportIndexContribution["yamlRole"]
  },
): { readonly fileId: number; readonly existed: boolean } {
  statements.insertComponent.run(file.componentPath)
  const componentId = integerId(statements.selectComponent.get(file.componentPath))
  const existing = statements.selectFile.get(file.projectPath)
  const result = statements.upsertFile.run(file.projectPath, componentId, file.resourceKind, file.yamlRole ?? null)
  return existing === undefined
    ? { fileId: Number(result.lastInsertRowid), existed: false }
    : { fileId: integerId(existing), existed: true }
}

function insertLocalValidation(
  statements: StoreStatements,
  fileId: number,
  update: Pick<ProjectStateYamlFileUpdate, "localValidation">,
): void {
  statements.insertValidation.run(
    fileId,
    update.localValidation.schemaDiagnostics.some(({ severity }) => severity === "error") ? 0 : 1,
    update.localValidation.contributedFacts ? 1 : 0,
  )
  insertDiagnostics(statements, fileId, "local", update.localValidation.diagnostics)
  insertDiagnostics(statements, fileId, "schema", update.localValidation.schemaDiagnostics)
}

function insertFinalYamlState(
  statements: StoreStatements,
  fileId: number,
  update: Pick<ProjectStateYamlFileUpdate, "localValidation" | "pendingReferences" | "pendingChecks">,
): void {
  insertLocalValidation(statements, fileId, update)
  update.pendingReferences.forEach((entry, ordinal) => insertPendingReference(statements, fileId, ordinal, entry))
  update.pendingChecks.forEach((check, ordinal) => insertPendingCheck(statements, fileId, ordinal, check))
}

function replaceDependencies(statements: StoreStatements, update: ProjectStateYamlFileUpdate): void {
  const sourceFileId = integerId(statements.selectFile.get(update.projectPath))
  statements.deleteDependencies.run(sourceFileId)
  insertDependencies(statements, update, sourceFileId)
}

function insertDependencies(
  statements: StoreStatements,
  update: Pick<ProjectStateYamlFileUpdate, "projectPath" | "dependencies">,
  knownSourceFileId?: number,
): void {
  const sourceFileId = knownSourceFileId ?? integerId(statements.selectFile.get(update.projectPath))
  update.dependencies.forEach((dependency, ordinal) => {
    statements.insertDependency.run(sourceFileId, null, ordinal, dependency)
  })
}

function deleteFileContribution(statements: StoreStatements, fileId: number): void {
  statements.deleteValidation.run(fileId)
  statements.deleteHash.run(fileId)
  statements.deleteDiagnostics.run(fileId)
  statements.deleteReferences.run(fileId)
  statements.deletePendingReferences.run(fileId)
  statements.deleteOwnerFacts.run(fileId)
  statements.deleteFields.run(fileId)
  statements.deleteForms.run(fileId)
  statements.deletePendingChecks.run(fileId)
  statements.deleteDependencies.run(fileId)
}

function insertDiagnostics(
  statements: StoreStatements,
  fileId: number,
  kind: "local" | "schema",
  diagnostics: readonly ProjectStateDiagnostic[],
): void {
  diagnostics.forEach((diagnostic, ordinal) => {
    statements.insertDiagnostic.run(
      fileId,
      kind,
      ordinal,
      diagnostic.severity,
      diagnostic.source,
      diagnostic.message,
      diagnostic.line,
      diagnostic.col,
      diagnostic.path ?? null,
    )
  })
}

function insertPendingReference(
  statements: StoreStatements,
  fileId: number,
  ordinal: number,
  entry: ProjectStatePendingReference,
): void {
  statements.insertPendingReference.run(
    fileId,
    ordinal,
    entry.canonical,
    entry.constraint.kind,
    encodeValue({ target: entry.target, constraint: entry.constraint }),
    encodeJson(entry.yamlPath),
  )
}

function insertPendingCheck(
  statements: StoreStatements,
  fileId: number,
  ordinal: number,
  check: ProjectStatePendingDependencyCheck,
): void {
  statements.insertPendingCheck.run(
    fileId,
    ordinal,
    check.kind,
    encodeJson(check),
    check.location.line,
    check.location.col,
    encodeJson(check.yamlPath),
  )
}

function readComponentUpdates(database: DatabaseSync, componentPath: string): ProjectStateFileUpdate[] {
  const files = database.prepare(`
    SELECT pf.id, pf.project_path, c.path AS component_path, pf.resource_kind, pf.yaml_role
    FROM project_files pf JOIN components c ON c.id = pf.component_id
    WHERE c.path = ? COLLATE BINARY
    ORDER BY pf.id
  `).all(componentPath) as unknown as (FileIdentityRow & { id: number })[]
  return files.map((file) => {
    const identity = fileIdentityFromRow(file)
    if (file.resource_kind === "resource") return { kind: "resource", ...identity }
    if (file.yaml_role === null) throw new Error("У YAML-файла отсутствует yaml_role")
    return readYamlUpdate(database, file.id, identity as ProjectStateYamlFileUpdate)
  })
}

function readComponentHashBytes(database: DatabaseSync, componentPath: string): Uint8Array {
  const rows = database.prepare(`
    SELECT h.hash
    FROM project_files pf
    JOIN components c ON c.id = pf.component_id
    JOIN file_hashes h ON h.file_id = pf.id
    WHERE c.path = ? COLLATE BINARY
    ORDER BY pf.id
  `).all(componentPath) as unknown as { hash: Uint8Array }[]
  const hashBytes = new Uint8Array(rows.length * 8)
  rows.forEach(({ hash }, index) => hashBytes.set(hash, index * 8))
  return hashBytes
}

function readYamlUpdate(
  database: DatabaseSync,
  fileId: number,
  identity: Pick<ProjectStateYamlFileUpdate, "projectPath" | "componentPath" | "resourceKind" | "yamlRole">,
): ProjectStateYamlFileUpdate {
  const validation = database.prepare(`
    SELECT contributed_facts FROM file_validation_results WHERE file_id = ?
  `).get(fileId) as { contributed_facts: number } | undefined
  if (validation === undefined) throw new Error("У YAML-файла отсутствует результат локальной проверки")
  const diagnostics = database.prepare(`
    SELECT diagnostic_kind, line, col, severity, source, message, yaml_path
    FROM local_diagnostics WHERE source_file_id = ?
    ORDER BY diagnostic_kind, ordinal, id
  `).all(fileId) as unknown as (Omit<DiagnosticRow, "project_path"> & { diagnostic_kind: string })[]
  const references = (database.prepare(`
    SELECT entry_kind AS kind, canonical_key AS canonical, details_value
    FROM reference_entries WHERE source_file_id = ? ORDER BY ordinal, id
  `).all(fileId) as unknown as {
    kind: ProjectStateReferenceEntry["kind"]
    canonical: string
    details_value: Uint8Array | null
  }[]).map(({ kind, canonical, details_value }) => ({
    kind,
    canonical,
    ...(details_value === null
      ? {}
      : { details: decodeValue<NonNullable<ProjectStateReferenceEntry["details"]>>(details_value) }),
  }))
  const pendingReferences = (database.prepare(`
    SELECT canonical_target, filter_value, yaml_path
    FROM pending_references WHERE source_file_id = ? ORDER BY ordinal, id
  `).all(fileId) as unknown as PendingReferenceRow[]).map(({ canonical_target, filter_value, yaml_path }) => {
    const payload = decodeValue<{ target: ProjectStatePendingReference["target"]; constraint: ProjectStatePendingReference["constraint"] }>(filter_value)
    return { canonical: canonical_target, yamlPath: decodeJson<YamlPath>(yaml_path), ...payload }
  })
  const ownerRows = database.prepare(`
    SELECT 0 AS request_index, source_file_id, ordinal, owner_key, fact_kind, fact_key, fact_value
    FROM owner_facts WHERE source_file_id = ? ORDER BY ordinal, id
  `).all(fileId) as unknown as OwnerFactProjectionRow[]
  const ownersByKey = new Map<string, OwnerFactProjectionRow[]>()
  for (const row of ownerRows) (ownersByKey.get(row.owner_key) ?? setArray(ownersByKey, row.owner_key)).push(row)
  const owners = [...ownersByKey.entries()].map(([ownerKey, rows]) => {
    return { owner: decodeOwnerKey(ownerKey), facts: projectStateOwnerFactsFromRows(rows) }
  })
  const fields = (database.prepare(`
    SELECT owner_key, field_kind, field_name, type_key, target_name, source_collection,
      parent_name, table_info, table_has_columns
    FROM field_entries WHERE source_file_id = ? ORDER BY ordinal, id
  `).all(fileId) as unknown as SqliteProjectStateFieldEntryRow[]).map(projectStateFieldEntryFromRow)
  const forms = (database.prepare(`
    SELECT source_value FROM form_entries WHERE source_file_id = ? ORDER BY ordinal, id
  `).all(fileId) as unknown as { source_value: Uint8Array }[]).map(({ source_value }) =>
    decodeValue<ProjectStateFormEntry>(source_value)
  )
  const pendingChecks = (database.prepare(`
    SELECT payload_json FROM pending_dependency_checks WHERE source_file_id = ? ORDER BY ordinal, id
  `).all(fileId) as unknown as { payload_json: string }[]).map(({ payload_json }) =>
    decodeJson<ProjectStatePendingDependencyCheck>(payload_json)
  )
  const dependencies = (database.prepare(`
    SELECT dependency_key FROM file_dependencies WHERE source_file_id = ? ORDER BY ordinal
  `).all(fileId) as unknown as { dependency_key: string }[]).map(({ dependency_key }) => dependency_key)

  const local = diagnostics.filter(({ diagnostic_kind }) => diagnostic_kind === "local").map(projectStateDiagnosticFromRow)
  const schema = diagnostics.filter(({ diagnostic_kind }) => diagnostic_kind === "schema").map(projectStateDiagnosticFromRow)
  return {
    kind: "yaml",
    ...identity,
    localValidation: {
      contributedFacts: validation.contributed_facts === 1,
      diagnostics: local,
      schemaDiagnostics: schema,
    },
    references,
    pendingReferences,
    owners,
    fields,
    forms,
    pendingChecks,
    dependencies,
  }
}

function createStoreRequestTables(database: DatabaseSync): void {
  database.exec(`
    CREATE TEMP TABLE file_comparison_requests (
      request_index INTEGER PRIMARY KEY,
      project_path TEXT NOT NULL COLLATE BINARY,
      hash BLOB NOT NULL CHECK(length(hash) = 8)
    ) STRICT;

    CREATE TEMP TABLE file_baseline_requests (
      request_index INTEGER PRIMARY KEY,
      project_path TEXT NOT NULL COLLATE BINARY,
      component_path TEXT NOT NULL COLLATE BINARY,
      resource_kind TEXT NOT NULL COLLATE BINARY,
      yaml_role TEXT
    ) STRICT;
  `)
}

function loadBaselineRequests(
  database: DatabaseSync,
  files: readonly ProjectStateFileIdentity[],
): void {
  database.exec("DELETE FROM temp.file_baseline_requests")
  const insert = database.prepare(`
    INSERT INTO temp.file_baseline_requests(
      request_index, project_path, component_path, resource_kind, yaml_role
    ) VALUES (?, ?, ?, ?, ?)
  `)
  files.forEach((file, index) => insert.run(
    index,
    file.projectPath,
    file.componentPath,
    file.resourceKind,
    file.yamlRole ?? null,
  ))
}

function loadComparisonRequests(
  database: DatabaseSync,
  files: readonly { readonly projectPath: string }[],
  hashBytes: Uint8Array,
): void {
  database.exec("DELETE FROM temp.file_comparison_requests")
  const insert = database.prepare(`
    INSERT INTO temp.file_comparison_requests(request_index, project_path, hash)
    VALUES (?, ?, substr(?, ?, 8))
  `)
  files.forEach((file, index) => insert.run(index, file.projectPath, hashBytes, index * 8 + 1))
}

function integerId(value: unknown): number {
  if (typeof value !== "object" || value === null || !("id" in value) || typeof value.id !== "number") {
    throw new Error("SQLite не вернул идентификатор строки")
  }
  return value.id
}

interface FileIdentityRow {
  readonly project_path: string
  readonly component_path: string
  readonly resource_kind: "yaml" | "resource"
  readonly yaml_role: "configuration" | "properties" | "form" | null
}

function fileIdentityFromRow(row: FileIdentityRow) {
  return row.yaml_role === null
    ? { projectPath: row.project_path, componentPath: row.component_path, resourceKind: row.resource_kind }
    : {
        projectPath: row.project_path,
        componentPath: row.component_path,
        resourceKind: row.resource_kind,
        yamlRole: row.yaml_role,
      }
}

interface DiagnosticRow {
  readonly project_path: string
  readonly line: number
  readonly col: number
  readonly severity: Diagnostic["severity"]
  readonly source: Diagnostic["source"]
  readonly message: string
  readonly yaml_path: string | null
}

interface PublishedDiagnosticRow extends DiagnosticRow {
  readonly component_path: string
  readonly diagnostic_kind: "local" | "schema"
}

function diagnosticFromRow(row: DiagnosticRow): Diagnostic {
  return {
    filePath: row.project_path,
    ...projectStateDiagnosticFromRow(row),
  }
}

function projectStateDiagnosticFromRow(row: Omit<DiagnosticRow, "project_path">): ProjectStateDiagnostic {
  return {
    line: row.line,
    col: row.col,
    severity: row.severity,
    source: row.source,
    message: row.message,
    ...(row.yaml_path === null ? {} : { path: row.yaml_path }),
  }
}

interface PendingReferenceRow {
  readonly canonical_target: string
  readonly filter_value: Uint8Array
  readonly yaml_path: string
}

interface OwnerFactProjectionRow {
  readonly request_index: number
  readonly source_file_id: number
  readonly ordinal: number
  readonly owner_key: string
  readonly fact_kind: string
  readonly fact_key: string
  readonly fact_value: Uint8Array | null
}

function setArray<K, T>(map: Map<K, T[]>, key: K): T[] {
  const result: T[] = []
  map.set(key, result)
  return result
}
