import {
  resolvedProjectReferenceResult,
  unresolvedProjectReferenceResult,
  type PendingMetadataTargetReference,
} from "../validation/projectReferenceIndex"
import type { Diagnostic } from "../validation/types"
import {
  ownerMetadataFromFacts,
  ownerMetadataNotFound,
  type OwnerMetadataCache,
} from "../validation/dataPath/ownerCache"
import type { FormDataPathSource, OwnerTypeRef } from "../validation/dataPath/types"
import type { ObjectField, ObjectFieldIndex } from "../validation/dataPath/objectFields"
import type { FormDataPathIndex } from "../validation/dataPath/formIndex"
import { validatePendingChecks } from "../validation/projectValidationPendingChecks"
import { createProjectDegradationDiagnostics } from "../validation/projectFirstPassReadiness"
import type { ProjectStateFieldEntry, ProjectStateFormEntry } from "./fileUpdate"
import type { ProjectDependencyInput, ProjectDependencyInputQuery, ProjectStateQueryPort } from "./readSession"

export interface ProjectStatePendingReferenceCheck {
  readonly requestId: string
  readonly componentPath: string
  readonly reference: PendingMetadataTargetReference
}

export interface ProjectStatePendingOwnerCheck {
  readonly requestId: string
  readonly componentPath: string
  readonly owner: OwnerTypeRef
}

export interface ProjectStateDependencyReadiness {
  readonly blockedComponentPaths: ReadonlySet<string>
  readonly diagnostics: readonly Diagnostic[]
}

const VALIDATION_STATUS_BATCH_SIZE = 2_000

export function readProjectStateDependencyReadiness(params: {
  readonly queryPort: Pick<ProjectStateQueryPort, "readValidationStatus">
}): ProjectStateDependencyReadiness {
  const componentPaths = new Set<string>()
  let hasConfiguration = false
  let hasConfigurationRoot = false
  let configurationFilesReady = true
  for (let offset = 0; ; offset += VALIDATION_STATUS_BATCH_SIZE) {
    const rows = params.queryPort.readValidationStatus({ offset, batchSize: VALIDATION_STATUS_BATCH_SIZE })
    for (const row of rows) {
      componentPaths.add(row.componentPath)
      if (row.componentPath !== "cf") continue
      hasConfiguration = true
      if (row.projectPath === "cf/Конфигурация.yaml") hasConfigurationRoot = true
      if (row.schemaReady === false || row.contributedFacts === false) configurationFilesReady = false
    }
    if (rows.length < VALIDATION_STATUS_BATCH_SIZE) break
  }
  const configurationReady = hasConfiguration && hasConfigurationRoot && configurationFilesReady
  const blockedComponentPaths = new Set(
    configurationReady
      ? []
      : [...componentPaths].filter((componentPath) => componentPath.startsWith("cfe/") && componentPath.length > 4),
  )
  return {
    blockedComponentPaths,
    diagnostics: createProjectDegradationDiagnostics({
      projectDir: "",
      hasConfiguration,
      blockedComponentPaths: [...blockedComponentPaths],
    }),
  }
}

export function validateProjectStateReferenceBatch(params: {
  readonly checks: readonly ProjectStatePendingReferenceCheck[]
  readonly queryPort: Pick<ProjectStateQueryPort, "resolveTargets">
}): readonly Diagnostic[] {
  const results = params.queryPort.resolveTargets(
    params.checks.map(({ requestId, componentPath, reference }) => ({
      requestId,
      componentPath,
      canonicalTarget: reference.canonical,
    })),
  )
  const diagnostics: Diagnostic[] = []
  for (let index = 0; index < params.checks.length; index += 1) {
    const check = params.checks[index]!
    const result = results[index]
    if (result === undefined || result.requestId !== check.requestId) {
      throw new Error(`Ответ dependency lookup не соответствует запросу ${check.requestId}`)
    }
    if (result.status === "found") {
      const resolved = resolvedProjectReferenceResult(check.reference, result.target.details)
      if (!resolved.ok) diagnostics.push(...resolved.diagnostics)
    } else {
      diagnostics.push(...unresolvedProjectReferenceResult(check.reference, result.status).diagnostics)
    }
  }
  return diagnostics
}

export function validateProjectStateOwnerBatch(params: {
  readonly checks: readonly ProjectStatePendingOwnerCheck[]
  readonly projectDir: string
  readonly queryPort: Pick<ProjectStateQueryPort, "readOwners">
}): readonly Diagnostic[] {
  const results = params.queryPort.readOwners(
    params.checks.map(({ requestId, componentPath, owner }) => ({ requestId, componentPath, owner })),
  )
  const diagnostics: Diagnostic[] = []
  for (let index = 0; index < params.checks.length; index += 1) {
    const check = params.checks[index]!
    const result = results[index]
    if (result === undefined || result.requestId !== check.requestId) {
      throw new Error(`Ответ dependency lookup не соответствует запросу ${check.requestId}`)
    }
    if (result.status !== "missing") continue
    diagnostics.push(
      ...ownerMetadataNotFound({
        projectDir: `${params.projectDir}/${check.componentPath}`,
        ref: check.owner,
      }).diagnostics,
    )
  }
  return diagnostics
}

export function validateProjectStateDependencyBatch(params: {
  readonly checks: readonly ProjectDependencyInputQuery[]
  readonly projectDir: string
  readonly queryPort: Pick<ProjectStateQueryPort, "readDependencyInputs">
}): readonly Diagnostic[] {
  const results = params.queryPort.readDependencyInputs(params.checks)
  const diagnostics: Diagnostic[] = []
  for (let index = 0; index < params.checks.length; index += 1) {
    const check = params.checks[index]!
    const result = results[index]
    if (result === undefined || result.requestId !== check.requestId) {
      throw new Error(`Ответ dependency lookup не соответствует запросу ${check.requestId}`)
    }
    if (result.status !== "found") continue
    diagnostics.push(
      ...validatePendingChecks({
        ownerCache: dependencyOwnerCache({
          input: result.input,
          projectDir: `${params.projectDir}/${check.componentPath}`,
        }),
        checks: [
          {
            ...check.check,
            location: { ...check.check.location, filePath: check.projectPath },
            index: dependencyFormIndex(result.input.forms),
          },
        ],
      }).diagnostics,
    )
  }
  return diagnostics
}

function dependencyOwnerCache(params: { input: ProjectDependencyInput; projectDir: string }): OwnerMetadataCache {
  const owners = new Map(params.input.owners.map(({ owner, facts }) => [ownerKey(owner), { owner, facts }]))
  return {
    get(ref) {
      const stored = owners.get(ownerKey(ref))
      if (stored === undefined) return ownerMetadataNotFound({ projectDir: params.projectDir, ref })
      return ownerMetadataFromFacts({
        projectDir: params.projectDir,
        ref,
        facts: stored.facts,
        fieldIndex: projectStateFieldIndex(ref, params.input.fields),
      })
    },
    listRefs(kind) {
      return [...owners.values()].flatMap(({ owner }) => owner.kind === kind ? [owner] : [])
    },
  }
}

function projectStateFieldIndex(owner: OwnerTypeRef, entries: readonly ProjectStateFieldEntry[]): ObjectFieldIndex {
  const relevant = entries.filter((entry) => ownerKey(entry.owner) === ownerKey(owner))
  const columns = new Map<string, Map<string, ObjectField>>()
  for (const entry of relevant) {
    if (entry.parentName === undefined) continue
    const parentColumns = columns.get(entry.parentName) ?? new Map<string, ObjectField>()
    parentColumns.set(entry.name, projectStateObjectField(entry))
    columns.set(entry.parentName, parentColumns)
  }
  const fields = new Map<string, ObjectField>()
  const standardAttributeAliases = new Map<string, string>()
  for (const entry of relevant) {
    if (entry.parentName !== undefined) continue
    const field = projectStateObjectField(entry, columns.get(entry.name))
    fields.set(entry.name, field)
    if (entry.targetName !== undefined) {
      fields.set(entry.targetName, field)
      standardAttributeAliases.set(entry.targetName, entry.name)
    }
  }
  return { fields, standardAttributeAliases, diagnostics: [] }
}

function projectStateObjectField(
  entry: ProjectStateFieldEntry,
  columns?: Map<string, ObjectField>,
): ObjectField {
  return {
    name: entry.name,
    kind: entry.kind,
    typeInfo: entry.typeInfo,
    ...(entry.targetName === undefined ? {} : { targetName: entry.targetName }),
    ...(entry.sourceCollection === undefined ? {} : { sourceCollection: entry.sourceCollection }),
    ...(entry.table === undefined
      ? {}
      : { tableSource: { table: entry.table, columns: columns ?? new Map(), hasColumns: entry.tableHasColumns ?? false } }),
  }
}

function dependencyFormIndex(entries: readonly ProjectStateFormEntry[]): FormDataPathIndex {
  const roots = new Map<string, FormDataPathSource>()
  const additionalColumnsByTablePath = new Map()
  for (const entry of entries) {
    if (entry.kind === "root") {
      roots.set(entry.name, {
        kind: entry.source.kind,
        name: entry.source.name,
        typeInfo: entry.source.typeInfo,
        ...(entry.source.table === undefined
          ? {}
          : {
              tableSource: {
                table: entry.source.table,
                columns: new Map(),
                hasColumns: entry.source.tableHasColumns ?? false,
              },
            }),
      })
      continue
    }
    const columns = additionalColumnsByTablePath.get(entry.tablePath) ?? new Map()
    if (!columns.has(entry.name)) columns.set(entry.name, entry.source)
    additionalColumnsByTablePath.set(entry.tablePath, columns)
  }
  return {
    roots,
    additionalColumnsByTablePath,
    duplicateDiagnostics: [],
    getRoot(name) {
      return roots.get(name)
    },
  }
}

function ownerKey(ref: OwnerTypeRef): string {
  return `${ref.kind}:${ref.name ?? ""}`
}
