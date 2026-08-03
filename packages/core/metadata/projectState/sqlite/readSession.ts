import { constants, DatabaseSync } from "node:sqlite"
import { BroadcastChannel } from "node:worker_threads"
import type { ProjectStateReadToken } from "../contracts"
import type {
  ProjectDependencyInput,
  ProjectDependencyInputQuery,
  ProjectDependencyInputResult,
  ProjectDependencyOwnerInputQuery,
  ProjectDependencyOwnerInputResult,
  ProjectComponentTargetPage,
  ProjectComponentTargetPageQuery,
  ProjectOwnerLookup,
  ProjectOwnerRefPage,
  ProjectOwnerRefPageQuery,
  ProjectOwnerLookupResult,
  ProjectReferenceLookup,
  ProjectReferenceLocation,
  ProjectReferenceLookupResult,
  ProjectStateQueryPort,
  ProjectStateReadSession,
  ProjectTargetLookup,
  ProjectTargetLookupResult,
} from "../readSession"
import { createProjectStateReadSession, ProjectStateReadSessionClosedError } from "../readSession"
import type { ProjectStateFieldEntry, ProjectStateFormEntry, ProjectStatePendingDependencyCheck } from "../fileUpdate"
import {
  projectStateDataPathReferenceLocation,
  resolveProjectStateDataPathReferenceBatch,
} from "../dependencyValidation"
import { decodeJson, decodeOwnerKey, decodeValue, encodeOwnerKey } from "./codec"
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

  const queryPort = createSqliteProjectStateQueryPort(database)
  const session = createProjectStateReadSession({
    token,
    queryPort,
    beforeRead: assertCurrentLifecycle,
    close() {
      lifecycleChannel.close()
      database.close()
    },
    onClose: options.onClose,
  })
  lifecycleChannel.onmessage = () => session.close()
  try {
    assertCurrentLifecycle()
  } catch (error) {
    session.close()
    throw error
  }
  return session

  function assertCurrentLifecycle(): void {
    const row = database.prepare("SELECT value FROM cache_meta WHERE key = 'lifecycle_nonce'").get() as
      | { value: string }
      | undefined
    if (row?.value !== payload.lifecycleNonce) {
      throw new ProjectStateReadSessionClosedError(token)
    }
  }
}

export function createSqliteProjectStateQueryPort(database: DatabaseSync): ProjectStateQueryPort {
  createRequestTables(database)
  const queryPort: ProjectStateQueryPort = {
    resolveTargets: (requests) => resolveTargets(database, requests),
    readOwners: (requests) => readOwners(database, requests),
    findReferences: (requests) => findReferences(database, queryPort, requests),
    readDependencyInputs: (requests) => readDependencyInputs(database, requests),
    readDependencyOwnerInputs: (requests) => readDependencyOwnerInputs(database, requests),
    readOwnerRefPage: (query) => readOwnerRefPage(database, query),
    readComponentTargetPage: (query) => readComponentTargetPage(database, query),
    readValidationStatus: (query) => readValidationStatus(database, query),
  }
  return queryPort
}

const OWNER_REF_PAGE_SIZE = 2_000
const COMPONENT_TARGET_PAGE_SIZE = 2_000

function readComponentTargetPage(
  database: DatabaseSync,
  query: ProjectComponentTargetPageQuery,
): ProjectComponentTargetPage {
  const rows = database.prepare(`
    SELECT e.canonical_key, MIN(pf.project_path) AS project_path
    FROM reference_entries e
    JOIN project_files pf ON pf.id = e.source_file_id
    JOIN components c ON c.id = pf.component_id
    WHERE c.path = ? COLLATE BINARY
      AND e.canonical_key > ? COLLATE BINARY
    GROUP BY e.canonical_key
    HAVING COUNT(DISTINCT e.source_file_id) = 1
    ORDER BY e.canonical_key COLLATE BINARY
    LIMIT ?
  `).all(
    query.componentPath,
    query.cursor ?? "",
    COMPONENT_TARGET_PAGE_SIZE + 1,
  ) as unknown as { canonical_key: string; project_path: string }[]
  const pageRows = rows.slice(0, COMPONENT_TARGET_PAGE_SIZE)
  return {
    entries: pageRows.map(({ canonical_key, project_path }) => ({
      logicalAddress: canonical_key,
      sourceProjectPath: project_path,
    })),
    ...(rows.length <= COMPONENT_TARGET_PAGE_SIZE
      ? {}
      : { nextCursor: pageRows[pageRows.length - 1]!.canonical_key }),
  }
}

function readValidationStatus(
  database: DatabaseSync,
  query: { readonly offset: number; readonly batchSize: number },
) {
  const rows = database.prepare(`
    SELECT pf.project_path, c.path AS component_path, v.schema_ready, v.contributed_facts
    FROM project_files pf
    JOIN components c ON c.id = pf.component_id
    LEFT JOIN file_validation_results v ON v.file_id = pf.id
    ORDER BY pf.id
    LIMIT ? OFFSET ?
  `).all(query.batchSize, query.offset) as unknown as {
    project_path: string
    component_path: string
    schema_ready: number | null
    contributed_facts: number | null
  }[]
  return rows.map((row) => ({
    projectPath: row.project_path,
    componentPath: row.component_path,
    ...(row.schema_ready === null ? {} : { schemaReady: row.schema_ready === 1 }),
    ...(row.contributed_facts === null ? {} : { contributedFacts: row.contributed_facts === 1 }),
  }))
}

export function readDependencyInputs(
  database: DatabaseSync,
  requests: readonly ProjectDependencyInputQuery[],
): readonly ProjectDependencyInputResult[] {
  createRequestTables(database)
  loadDependencyRequests(database, requests)
  loadDependencyOwnerSelections(database)
  const selectedRows = database.prepare(`
    SELECT request_index FROM temp.dependency_owner_selections ORDER BY request_index
  `).all() as unknown as { request_index: number }[]
  const found = new Set(selectedRows.map(({ request_index }) => request_index))
  const inputs = new Map<number, MutableDependencyInput>()
  for (const index of found) inputs.set(index, { ownerRows: [], fields: [], forms: [] })
  if (found.size > 0) {
    const ownerRows = database.prepare(`
      SELECT r.request_index, o.source_file_id, o.ordinal, o.owner_key, o.fact_kind, o.fact_key, o.fact_value
      FROM temp.dependency_requests r
      JOIN temp.dependency_owner_selections s ON s.request_index = r.request_index
      JOIN owner_facts o ON o.source_file_id = s.source_file_id
        AND o.owner_key = r.owner_key COLLATE BINARY
      ORDER BY r.request_index, o.ordinal, o.id
    `).all() as unknown as OwnerFactRow[]
    for (const row of ownerRows) inputs.get(row.request_index)!.ownerRows.push(row)

    const fieldRows = database.prepare(`
      SELECT r.request_index, f.owner_key, f.field_kind, f.field_name, f.type_key,
        f.target_name, f.source_collection, f.parent_name, f.table_info, f.table_has_columns
      FROM temp.dependency_requests r
      JOIN temp.dependency_owner_selections s ON s.request_index = r.request_index
      JOIN field_entries f ON f.source_file_id = s.source_file_id
        AND f.owner_key = r.owner_key COLLATE BINARY
      ORDER BY r.request_index, f.ordinal, f.id
    `).all() as unknown as (SqliteProjectStateFieldEntryRow & { request_index: number })[]
    for (const row of fieldRows) inputs.get(row.request_index)!.fields.push(projectStateFieldEntryFromRow(row))

    const formRows = database.prepare(`
      SELECT r.request_index, f.source_value
      FROM temp.dependency_requests r
      JOIN project_files pf ON pf.project_path = r.project_path COLLATE BINARY
      JOIN form_entries f ON f.source_file_id = pf.id
      ORDER BY r.request_index, f.ordinal, f.id
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

function readDependencyOwnerInputs(
  database: DatabaseSync,
  requests: readonly ProjectDependencyOwnerInputQuery[],
): readonly ProjectDependencyOwnerInputResult[] {
  const owners = readOwners(database, requests)
  const fieldRows = database.prepare(`
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
    SELECT s.request_index, f.owner_key, f.field_kind, f.field_name, f.type_key,
      f.target_name, f.source_collection, f.parent_name, f.table_info, f.table_has_columns
    FROM selected s
    JOIN field_entries f ON f.source_file_id = s.source_file_id
    JOIN temp.owner_requests r ON r.request_index = s.request_index
      AND r.lookup_key = f.owner_key COLLATE BINARY
    WHERE s.candidate_count = 1
    ORDER BY s.request_index, f.ordinal, f.id
  `).all() as unknown as (SqliteProjectStateFieldEntryRow & { request_index: number })[]
  const fieldsByRequest = new Map<number, ProjectStateFieldEntry[]>()
  for (const row of fieldRows) {
    ;(fieldsByRequest.get(row.request_index) ?? setArray(fieldsByRequest, row.request_index))
      .push(projectStateFieldEntryFromRow(row))
  }
  return requests.map(({ requestId, owner }, index) => {
    const result = owners[index]
    return result?.status === "found"
      ? {
          requestId,
          status: "found" as const,
          input: { owner, facts: result.facts, fields: fieldsByRequest.get(index) ?? [] },
        }
      : { requestId, status: "missing" as const }
  })
}

function readOwnerRefPage(
  database: DatabaseSync,
  query: ProjectOwnerRefPageQuery,
): ProjectOwnerRefPage {
  const prefix = `${query.kind.length}:${query.kind}`
  const rows = database.prepare(`
    WITH request(component_path) AS (VALUES (?)), candidate_files AS (
      SELECT DISTINCT o.owner_key, o.source_file_id,
        CASE WHEN c.path = r.component_path COLLATE BINARY THEN 0 ELSE 1 END AS priority
      FROM request r
      JOIN owner_facts o
      JOIN project_files pf ON pf.id = o.source_file_id
      JOIN components c ON c.id = pf.component_id
      WHERE ${visibleComponent("r", "c")}
        AND o.owner_key > ? COLLATE BINARY
        AND o.owner_key >= ? COLLATE BINARY
        AND o.owner_key < ? COLLATE BINARY
    ), best AS (
      SELECT owner_key, MIN(priority) AS priority
      FROM candidate_files
      GROUP BY owner_key
    ), selected AS (
      SELECT f.owner_key
      FROM candidate_files f
      JOIN best b USING(owner_key, priority)
      GROUP BY f.owner_key
      HAVING COUNT(*) = 1
    )
    SELECT owner_key
    FROM selected
    ORDER BY owner_key COLLATE BINARY
    LIMIT ?
  `).all(
    query.componentPath,
    query.cursor ?? "",
    prefix,
    `${prefix}\uffff`,
    OWNER_REF_PAGE_SIZE + 1,
  ) as unknown as { owner_key: string }[]
  const pageRows = rows.slice(0, OWNER_REF_PAGE_SIZE)
  return {
    refs: pageRows.map(({ owner_key }) => decodeOwnerKey(owner_key)),
    ...(rows.length <= OWNER_REF_PAGE_SIZE
      ? {}
      : { nextCursor: pageRows[pageRows.length - 1]!.owner_key }),
  }
}

export function resolveTargets(
  database: DatabaseSync,
  requests: readonly ProjectTargetLookup[],
): readonly ProjectTargetLookupResult[] {
  loadSimpleRequests(database, "target_requests", requests.map(({ requestId, componentPath, canonicalTarget }) => [requestId, componentPath, canonicalTarget]))
  const rows = database.prepare(`
    WITH candidates AS (
      SELECT r.request_index, e.entry_kind, e.canonical_key, e.details_value,
        pf.project_path, c.path AS component_path,
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
      MIN(c.entry_kind) AS entry_kind, MIN(c.canonical_key) AS canonical_key,
      MIN(c.details_value) AS details_value, MIN(c.project_path) AS project_path,
      MIN(c.component_path) AS component_path
    FROM temp.target_requests r
    LEFT JOIN best b ON b.request_index = r.request_index
    LEFT JOIN candidates c ON c.request_index = r.request_index AND c.priority = b.priority
    GROUP BY r.request_index
    ORDER BY r.request_index
  `).all() as unknown as TargetRow[]
  return requests.map(({ requestId }, index) => {
    const row = rows[index]
    if (row?.candidate_count === 1 && isReferenceKind(row.entry_kind) && row.canonical_key !== null) {
      return {
        requestId,
        status: "found" as const,
        target: {
          kind: row.entry_kind,
          canonical: row.canonical_key,
          ...(row.details_value === null ? {} : { details: decodeValue(row.details_value) }),
        },
        source: { projectPath: row.project_path!, componentPath: row.component_path! },
      }
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
  queryPort: ProjectStateQueryPort,
  requests: readonly ProjectReferenceLookup[],
): readonly ProjectReferenceLookupResult[] {
  loadReferenceRequests(database, requests)
  const metadataRows = database.prepare(`
    SELECT r.request_index, pf.project_path, c.path AS component_path,
      p.yaml_path, p.canonical_target
    FROM temp.reference_requests r
    JOIN pending_references p ON (
      p.canonical_target = r.lookup_key COLLATE BINARY
      OR (r.match_prefix = 1 AND substr(p.canonical_target, 1, length(r.lookup_key) + 1) = r.lookup_key || '.' COLLATE BINARY)
    )
    JOIN project_files pf ON pf.id = p.source_file_id
    JOIN components c ON c.id = pf.component_id
    WHERE ${visibleComponent("r", "c")}
    ORDER BY r.request_index, pf.id, p.ordinal, p.id
  `).all() as unknown as {
    request_index: number
    project_path: string
    component_path: string
    yaml_path: string
    canonical_target: string
  }[]
  const byRequest = new Map<number, ProjectReferenceLocation[]>()
  for (const row of metadataRows) {
    const references = byRequest.get(row.request_index) ?? setArray(byRequest, row.request_index)
    references.push({
      kind: "metadataTarget",
      projectPath: row.project_path,
      componentPath: row.component_path,
      yamlPath: decodeJson(row.yaml_path),
      canonical: row.canonical_target,
    })
  }

  const dataRows = database.prepare(`
    SELECT DISTINCT r.request_index, p.id, pf.project_path, c.path AS component_path, p.payload_json
    FROM temp.reference_requests r
    JOIN pending_dependency_checks p ON p.check_kind = 'dataPath'
    JOIN project_files pf ON pf.id = p.source_file_id
    JOIN components c ON c.id = pf.component_id
    WHERE r.data_path_owner_key IS NOT NULL AND ${visibleComponent("r", "c")}
    ORDER BY r.request_index, pf.id, p.ordinal, p.id
  `).all() as unknown as {
    request_index: number
    id: number
    project_path: string
    component_path: string
    payload_json: string
  }[]
  const resolvedDataPaths = resolveProjectStateDataPathReferenceBatch({
    checks: dataRows.map((row) => ({
      requestId: `data-path:${row.request_index}:${row.id}`,
      componentPath: row.component_path,
      projectPath: row.project_path,
      check: decodeJson<ProjectStatePendingDependencyCheck>(row.payload_json),
    })),
    projectDir: projectDirFromDatabase(database),
    queryPort,
  })
  const requestIndexById = new Map(dataRows.map((row) => [`data-path:${row.request_index}:${row.id}`, row.request_index]))
  for (const reference of resolvedDataPaths) {
    const requestIndex = requestIndexById.get(reference.requestId)
    if (requestIndex === undefined) continue
    const request = requests[requestIndex]
    if (request?.dataPathTarget === undefined || reference.target.source.kind !== "objectField") continue
    if (encodeOwnerKey(reference.target.source.owner) !== encodeOwnerKey(request.dataPathTarget.owner)) continue
    if (request.dataPathTarget.fieldName !== undefined && reference.target.source.name !== request.dataPathTarget.fieldName) continue
    const references = byRequest.get(requestIndex) ?? setArray(byRequest, requestIndex)
    references.push(projectStateDataPathReferenceLocation(reference))
  }
  return requests.map(({ requestId }, index) => ({ requestId, references: byRequest.get(index) ?? [] }))
}

function loadReferenceRequests(database: DatabaseSync, requests: readonly ProjectReferenceLookup[]): void {
  database.exec("DELETE FROM temp.reference_requests")
  const insert = database.prepare(`
    INSERT INTO temp.reference_requests(
      request_index, request_id, component_path, lookup_key, match_prefix,
      dependency_key, data_path_owner_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  requests.forEach((request, index) => insert.run(
    index,
    request.requestId,
    request.componentPath,
    request.canonical,
    request.match === "prefix" ? 1 : 0,
    request.canonical.split(".").slice(0, 2).join("."),
    request.dataPathTarget === undefined ? null : encodeOwnerKey(request.dataPathTarget.owner),
  ))
}

function projectDirFromDatabase(database: DatabaseSync): string {
  const row = database.prepare("SELECT value FROM cache_meta WHERE key = 'project_dir'").get() as { value: string } | undefined
  if (row === undefined) throw new Error("ProjectState не содержит project_dir")
  return row.value
}

function loadSimpleRequests(
  database: DatabaseSync,
  table: "target_requests" | "owner_requests",
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

function loadDependencyOwnerSelections(database: DatabaseSync): void {
  database.exec("DELETE FROM temp.dependency_owner_selections")
  database.exec(`
    INSERT INTO temp.dependency_owner_selections(request_index, source_file_id)
    WITH candidate_files AS (
      SELECT DISTINCT r.request_index, o.source_file_id,
        CASE WHEN c.path = r.component_path COLLATE BINARY THEN 0 ELSE 1 END AS priority
      FROM temp.dependency_requests r
      JOIN owner_facts o ON o.owner_key = r.owner_key COLLATE BINARY
      JOIN project_files pf ON pf.id = o.source_file_id
      JOIN components c ON c.id = pf.component_id
      WHERE ${visibleComponent("r", "c")}
    ), best AS (
      SELECT request_index, MIN(priority) AS priority
      FROM candidate_files
      GROUP BY request_index
    ), selected AS (
      SELECT f.request_index, f.source_file_id
      FROM candidate_files f
      JOIN best b USING(request_index, priority)
    )
    SELECT request_index, MIN(source_file_id)
    FROM selected
    GROUP BY request_index
    HAVING COUNT(*) = 1
  `)
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
      component_path TEXT NOT NULL COLLATE BINARY, lookup_key TEXT NOT NULL COLLATE BINARY,
      match_prefix INTEGER NOT NULL CHECK(match_prefix IN (0, 1)),
      dependency_key TEXT NOT NULL COLLATE BINARY,
      data_path_owner_key TEXT COLLATE BINARY
    ) STRICT;
    CREATE TEMP TABLE IF NOT EXISTS dependency_requests (
      request_index INTEGER PRIMARY KEY, request_id TEXT NOT NULL,
      component_path TEXT NOT NULL COLLATE BINARY, project_path TEXT NOT NULL COLLATE BINARY,
      owner_key TEXT NOT NULL COLLATE BINARY
    ) STRICT;
    CREATE TEMP TABLE IF NOT EXISTS dependency_owner_selections (
      request_index INTEGER PRIMARY KEY,
      source_file_id INTEGER NOT NULL
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
  readonly details_value: Uint8Array | null
  readonly project_path: string | null
  readonly component_path: string | null
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
