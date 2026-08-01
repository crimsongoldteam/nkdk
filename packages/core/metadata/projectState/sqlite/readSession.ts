import { constants, DatabaseSync } from "node:sqlite"
import { BroadcastChannel } from "node:worker_threads"
import type { ProjectStateReadToken } from "../contracts"
import type {
  ProjectDependencyInput,
  ProjectDependencyInputQuery,
  ProjectDependencyInputResult,
  ProjectOwnerLookup,
  ProjectOwnerLookupResult,
  ProjectReferenceLookup,
  ProjectReferenceLookupResult,
  ProjectStateReadSession,
  ProjectTargetLookup,
  ProjectTargetLookupResult,
} from "../readSession"
import { ProjectStateReadSessionClosedError } from "../readSession"
import type {
  ProjectStateFieldEntry,
  ProjectStateFormEntry,
} from "../fileUpdate"
import { decodeOwnerKey, decodeValue, encodeOwnerKey } from "./codec"
import { projectStateFieldEntryFromRow, type SqliteProjectStateFieldEntryRow } from "./fieldEntry"
import { projectStateOwnerFactsFromRows, type SqliteOwnerFactValueRow } from "./ownerFacts"
import {
  claimSqliteProjectStateReadToken,
  decodeSqliteProjectStateReadToken,
  sqliteProjectStateLifecycleChannel,
} from "./readToken"

export interface OpenSqliteProjectStateReadSessionOptions {
  readonly expectedStateId?: string
  readonly onClose?: (session: ProjectStateReadSession) => void
}

export function openSqliteProjectStateReadSession(
  token: ProjectStateReadToken,
  options: OpenSqliteProjectStateReadSessionOptions = {},
): ProjectStateReadSession {
  const payload = decodeSqliteProjectStateReadToken(token)
  if (options.expectedStateId !== undefined && payload.stateId !== options.expectedStateId) {
    throw new Error("Token относится к другому состоянию проекта")
  }

  const database = new DatabaseSync(payload.databaseName, { timeout: 5_000 })
  const lifecycleChannel = new BroadcastChannel(sqliteProjectStateLifecycleChannel(payload))
  lifecycleChannel.unref()
  try {
    assertTokenMetadata(database, payload)
    createRequestTables(database)
    makeMainDatabaseReadOnly(database)
    claimSqliteProjectStateReadToken(database, payload)
  } catch (error) {
    lifecycleChannel.close()
    database.close()
    throw error
  }

  let closed = false
  let session!: ProjectStateReadSession
  session = {
    resolveTargets(requests) {
      assertOpen()
      return resolveTargets(database, requests)
    },
    readOwners(requests) {
      assertOpen()
      return readOwners(database, requests)
    },
    findReferences(requests) {
      assertOpen()
      return findReferences(database, requests)
    },
    readDependencyInputs(requests) {
      assertOpen()
      return readDependencyInputs(database, requests)
    },
    close() {
      closeSession()
    },
  }
  lifecycleChannel.onmessage = closeSession
  try {
    assertCurrentLifecycle()
  } catch (error) {
    closeSession()
    throw error
  }
  return session

  function assertOpen(): void {
    if (closed) throw new ProjectStateReadSessionClosedError(token)
    assertCurrentLifecycle()
  }

  function assertCurrentLifecycle(): void {
    const row = database.prepare("SELECT value FROM cache_meta WHERE key = 'lifecycle_nonce'").get() as
      | { value: string }
      | undefined
    if (row?.value !== payload.lifecycleNonce) {
      closeSession()
      throw new ProjectStateReadSessionClosedError(token)
    }
  }

  function closeSession(): void {
    if (closed) return
    closed = true
    lifecycleChannel.close()
    database.close()
    options.onClose?.(session)
  }
}

export function readDependencyInputs(
  database: DatabaseSync,
  requests: readonly ProjectDependencyInputQuery[],
): readonly ProjectDependencyInputResult[] {
  createRequestTables(database)
  loadDependencyRequests(database, requests)
  const statusRows = database.prepare(`
    SELECT r.request_index, COUNT(DISTINCT CASE WHEN c.id IS NOT NULL THEN o.source_file_id END) AS candidate_count
    FROM temp.dependency_requests r
    LEFT JOIN project_files pf ON pf.project_path = r.project_path COLLATE BINARY
    LEFT JOIN components c ON c.id = pf.component_id AND ${visibleComponent("r", "c")}
    LEFT JOIN owner_facts o ON o.source_file_id = pf.id AND o.owner_key = r.owner_key COLLATE BINARY
    GROUP BY r.request_index
    ORDER BY r.request_index
  `).all() as unknown as { request_index: number; candidate_count: number }[]

  const found = new Set(statusRows.filter(({ candidate_count }) => candidate_count === 1).map(({ request_index }) => request_index))
  const inputs = new Map<number, MutableDependencyInput>()
  for (const index of found) inputs.set(index, { ownerRows: [], fields: [], forms: [] })
  if (found.size > 0) {
    const ownerRows = database.prepare(`
      SELECT r.request_index, o.source_file_id, o.ordinal, o.owner_key, o.fact_kind, o.fact_key, o.fact_value
      FROM temp.dependency_requests r
      JOIN components c ON ${visibleComponent("r", "c")}
      JOIN project_files pf ON pf.component_id = c.id
      JOIN owner_facts o ON o.source_file_id = pf.id
      WHERE r.request_index IN (SELECT request_index FROM temp.dependency_requests)
      ORDER BY r.request_index, o.source_file_id, o.ordinal, o.id
    `).all() as unknown as OwnerFactRow[]
    for (const row of ownerRows) if (found.has(row.request_index)) inputs.get(row.request_index)!.ownerRows.push(row)

    const fieldRows = database.prepare(`
      SELECT r.request_index, f.owner_key, f.field_kind, f.field_name, f.type_key,
        f.target_name, f.source_collection, f.parent_name, f.table_info, f.table_has_columns
      FROM temp.dependency_requests r
      JOIN components c ON ${visibleComponent("r", "c")}
      JOIN project_files pf ON pf.component_id = c.id
      JOIN field_entries f ON f.source_file_id = pf.id
      ORDER BY r.request_index, f.source_file_id, f.ordinal, f.id
    `).all() as unknown as (SqliteProjectStateFieldEntryRow & { request_index: number })[]
    for (const row of fieldRows) {
      if (found.has(row.request_index)) inputs.get(row.request_index)!.fields.push(projectStateFieldEntryFromRow(row))
    }

    const formRows = database.prepare(`
      SELECT r.request_index, f.source_value
      FROM temp.dependency_requests r
      JOIN components c ON ${visibleComponent("r", "c")}
      JOIN project_files pf ON pf.component_id = c.id
      JOIN form_entries f ON f.source_file_id = pf.id
      ORDER BY r.request_index, f.source_file_id, f.ordinal, f.id
    `).all() as unknown as { request_index: number; source_value: Uint8Array }[]
    for (const row of formRows) {
      if (found.has(row.request_index)) inputs.get(row.request_index)!.forms.push(decodeValue(row.source_value))
    }
  }

  return requests.map(({ requestId }, requestIndex) => {
    const input = inputs.get(requestIndex)
    return input === undefined
      ? { requestId, status: "missing" as const }
      : {
          requestId,
          status: "found" as const,
          input: {
            owners: ownerFactsFromRows(input.ownerRows),
            fields: input.fields,
            forms: input.forms,
          },
        }
  })
}

function resolveTargets(
  database: DatabaseSync,
  requests: readonly ProjectTargetLookup[],
): readonly ProjectTargetLookupResult[] {
  loadSimpleRequests(database, "target_requests", requests.map(({ requestId, componentPath, canonicalTarget }) => [requestId, componentPath, canonicalTarget]))
  const rows = database.prepare(`
    WITH candidates AS (
      SELECT r.request_index, e.entry_kind, e.canonical_key,
        CASE WHEN c.path = r.component_path COLLATE BINARY THEN 0 ELSE 1 END AS priority
      FROM temp.target_requests r
      JOIN reference_entries e ON e.canonical_key = r.lookup_key COLLATE BINARY
      JOIN project_files pf ON pf.id = e.source_file_id
      JOIN components c ON c.id = pf.component_id
      WHERE ${visibleComponent("r", "c")}
    ), best AS (
      SELECT request_index, MIN(priority) AS priority FROM candidates GROUP BY request_index
    )
    SELECT r.request_index, COUNT(c.canonical_key) AS candidate_count,
      MIN(c.entry_kind) AS entry_kind, MIN(c.canonical_key) AS canonical_key
    FROM temp.target_requests r
    LEFT JOIN best b ON b.request_index = r.request_index
    LEFT JOIN candidates c ON c.request_index = r.request_index AND c.priority = b.priority
    GROUP BY r.request_index
    ORDER BY r.request_index
  `).all() as unknown as TargetRow[]
  return requests.map(({ requestId }, index) => {
    const row = rows[index]
    if (row?.candidate_count === 1 && isReferenceKind(row.entry_kind) && row.canonical_key !== null) {
      return { requestId, status: "found" as const, target: { kind: row.entry_kind, canonical: row.canonical_key } }
    }
    return row !== undefined && row.candidate_count > 1
      ? { requestId, status: "ambiguous" as const }
      : { requestId, status: "missing" as const }
  })
}

function readOwners(
  database: DatabaseSync,
  requests: readonly ProjectOwnerLookup[],
): readonly ProjectOwnerLookupResult[] {
  loadSimpleRequests(database, "owner_requests", requests.map(({ requestId, componentPath, owner }) => [requestId, componentPath, encodeOwnerKey(owner)]))
  const rows = database.prepare(`
    WITH candidate_files AS (
      SELECT DISTINCT r.request_index, o.source_file_id,
        CASE WHEN c.path = r.component_path COLLATE BINARY THEN 0 ELSE 1 END AS priority
      FROM temp.owner_requests r
      JOIN owner_facts o ON o.owner_key = r.lookup_key COLLATE BINARY
      JOIN project_files pf ON pf.id = o.source_file_id
      JOIN components c ON c.id = pf.component_id
      WHERE ${visibleComponent("r", "c")}
    ), best AS (
      SELECT request_index, MIN(priority) AS priority FROM candidate_files GROUP BY request_index
    ), selected AS (
      SELECT f.*, COUNT(*) OVER (PARTITION BY f.request_index) AS candidate_count
      FROM candidate_files f JOIN best b USING(request_index, priority)
    )
    SELECT s.request_index, s.candidate_count, o.source_file_id, o.ordinal,
      o.owner_key, o.fact_kind, o.fact_key, o.fact_value
    FROM selected s
    JOIN owner_facts o ON o.source_file_id = s.source_file_id
    JOIN temp.owner_requests r ON r.request_index = s.request_index AND r.lookup_key = o.owner_key COLLATE BINARY
    ORDER BY s.request_index, o.ordinal, o.id
  `).all() as unknown as (OwnerFactRow & { candidate_count: number })[]
  const byRequest = new Map<number, (OwnerFactRow & { candidate_count: number })[]>()
  for (const row of rows) (byRequest.get(row.request_index) ?? setArray(byRequest, row.request_index)).push(row)
  return requests.map(({ requestId }, index) => {
    const matches = byRequest.get(index)
    if (matches === undefined) return { requestId, status: "missing" as const }
    return matches[0]?.candidate_count === 1
      ? { requestId, status: "found" as const, facts: projectStateOwnerFactsFromRows(matches) }
      : { requestId, status: "ambiguous" as const }
  })
}

function findReferences(
  database: DatabaseSync,
  requests: readonly ProjectReferenceLookup[],
): readonly ProjectReferenceLookupResult[] {
  loadSimpleRequests(database, "reference_requests", requests.map(({ requestId, componentPath, canonical }) => [requestId, componentPath, canonical]))
  const rows = database.prepare(`
    SELECT r.request_index, pf.project_path, c.path AS component_path
    FROM temp.reference_requests r
    JOIN reference_entries e ON e.canonical_key = r.lookup_key COLLATE BINARY
    JOIN project_files pf ON pf.id = e.source_file_id
    JOIN components c ON c.id = pf.component_id
    WHERE ${visibleComponent("r", "c")}
    GROUP BY r.request_index, pf.id
    ORDER BY r.request_index, pf.id
  `).all() as unknown as { request_index: number; project_path: string; component_path: string }[]
  const byRequest = new Map<number, { projectPath: string; componentPath: string }[]>()
  for (const row of rows) {
    const references = byRequest.get(row.request_index) ?? setArray(byRequest, row.request_index)
    references.push({ projectPath: row.project_path, componentPath: row.component_path })
  }
  return requests.map(({ requestId }, index) => ({ requestId, references: byRequest.get(index) ?? [] }))
}

function loadSimpleRequests(
  database: DatabaseSync,
  table: "target_requests" | "owner_requests" | "reference_requests",
  requests: readonly (readonly [requestId: string, componentPath: string, lookupKey: string])[],
): void {
  database.exec(`DELETE FROM temp.${table}`)
  const insert = database.prepare(`INSERT INTO temp.${table}(request_index, request_id, component_path, lookup_key) VALUES (?, ?, ?, ?)`)
  requests.forEach(([requestId, componentPath, lookupKey], index) => insert.run(index, requestId, componentPath, lookupKey))
}

function loadDependencyRequests(database: DatabaseSync, requests: readonly ProjectDependencyInputQuery[]): void {
  database.exec("DELETE FROM temp.dependency_requests")
  const insert = database.prepare(`
    INSERT INTO temp.dependency_requests(request_index, request_id, component_path, project_path, owner_key)
    VALUES (?, ?, ?, ?, ?)
  `)
  requests.forEach(({ requestId, componentPath, projectPath, check }, index) => {
    insert.run(index, requestId, componentPath, projectPath, encodeOwnerKey(check.owner))
  })
}

function createRequestTables(database: DatabaseSync): void {
  database.exec(`
    CREATE TEMP TABLE IF NOT EXISTS target_requests (
      request_index INTEGER PRIMARY KEY, request_id TEXT NOT NULL,
      component_path TEXT NOT NULL COLLATE BINARY, lookup_key TEXT NOT NULL COLLATE BINARY
    ) STRICT;
    CREATE TEMP TABLE IF NOT EXISTS owner_requests (
      request_index INTEGER PRIMARY KEY, request_id TEXT NOT NULL,
      component_path TEXT NOT NULL COLLATE BINARY, lookup_key TEXT NOT NULL COLLATE BINARY
    ) STRICT;
    CREATE TEMP TABLE IF NOT EXISTS reference_requests (
      request_index INTEGER PRIMARY KEY, request_id TEXT NOT NULL,
      component_path TEXT NOT NULL COLLATE BINARY, lookup_key TEXT NOT NULL COLLATE BINARY
    ) STRICT;
    CREATE TEMP TABLE IF NOT EXISTS dependency_requests (
      request_index INTEGER PRIMARY KEY, request_id TEXT NOT NULL,
      component_path TEXT NOT NULL COLLATE BINARY, project_path TEXT NOT NULL COLLATE BINARY,
      owner_key TEXT NOT NULL COLLATE BINARY
    ) STRICT;
  `)
}

function makeMainDatabaseReadOnly(database: DatabaseSync): void {
  database.setAuthorizer((action, first, _second, databaseName) => {
    if (databaseName === "main" && action === constants.SQLITE_INSERT && first === "read_token_claims") {
      return constants.SQLITE_OK
    }
    if (databaseName !== "main" || action === constants.SQLITE_READ) return constants.SQLITE_OK
    return constants.SQLITE_DENY
  })
}

function assertTokenMetadata(
  database: DatabaseSync,
  payload: { readonly stateId: string; readonly databaseName: string; readonly lifecycleNonce: string },
): void {
  const rows = database.prepare(`
    SELECT key, value FROM cache_meta
    WHERE key IN ('state_id', 'database_name', 'lifecycle_nonce')
  `).all() as unknown as { key: string; value: string }[]
  const metadata = new Map(rows.map(({ key, value }) => [key, value]))
  if (
    metadata.get("state_id") !== payload.stateId
    || metadata.get("database_name") !== payload.databaseName
    || metadata.get("lifecycle_nonce") !== payload.lifecycleNonce
  ) {
    throw new Error("Token чтения SQLite не соответствует состоянию проекта")
  }
}

function visibleComponent(request: string, component: string): string {
  return `(
    ${component}.path = ${request}.component_path COLLATE BINARY
    OR (
      ${component}.id = (
        SELECT base.id FROM components base
        WHERE instr(base.path, '/') = 0
        ORDER BY base.id LIMIT 1
      )
      AND ${component}.path <> ${request}.component_path COLLATE BINARY
    )
  )`
}

interface TargetRow {
  readonly request_index: number
  readonly candidate_count: number
  readonly entry_kind: string | null
  readonly canonical_key: string | null
}

interface OwnerFactRow extends SqliteOwnerFactValueRow {
  readonly request_index: number
  readonly source_file_id: number
  readonly ordinal: number
  readonly owner_key: string
  readonly fact_kind: string
  readonly fact_key: string
  readonly fact_value: Uint8Array | null
}

interface MutableDependencyInput {
  readonly ownerRows: OwnerFactRow[]
  readonly fields: ProjectStateFieldEntry[]
  readonly forms: ProjectStateFormEntry[]
}

function ownerFactsFromRows(rows: readonly OwnerFactRow[]): ProjectDependencyInput["owners"] {
  const groups = new Map<string, OwnerFactRow[]>()
  for (const row of rows) {
    const key = `${row.source_file_id}:${row.owner_key}`
    ;(groups.get(key) ?? setArray(groups, key)).push(row)
  }
  return [...groups.values()].map((group) => ({
    owner: decodeOwnerKey(group[0]!.owner_key),
    facts: projectStateOwnerFactsFromRows(group),
  }))
}

function setArray<K, T>(map: Map<K, T[]>, key: K): T[] {
  const value: T[] = []
  map.set(key, value)
  return value
}

function isReferenceKind(value: string | null): value is "object" | "member" | "value" {
  return value === "object" || value === "member" || value === "value"
}
