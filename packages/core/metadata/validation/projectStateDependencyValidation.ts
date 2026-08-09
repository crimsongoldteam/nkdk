import { join } from "node:path"
import {
  resolvedProjectReferenceResult,
  unresolvedProjectReferenceResult,
  type PendingMetadataTargetReference,
} from "./projectReferenceIndex"
import {
  getProjectReferenceObjectPathContributor,
  getProjectReferenceValueContributor,
} from "./projectReferenceIndexRegistry"
import type { Diagnostic } from "../diagnostics/types"
import {
  ownerMetadataFromFacts,
  ownerMetadataNotFound,
  type OwnerMetadataCache,
} from "./dataPath/ownerCache"
import type { FormDataPathSource, OwnerTypeRef } from "./dataPath/types"
import type { ResolvedDataPathTarget } from "./dataPath/resolver"
import { resolveDataPath } from "./dataPath/resolver"
import type { ObjectField, ObjectFieldIndex } from "./dataPath/objectFields"
import type { FormDataPathIndex } from "./dataPath/formIndex"
import {
  getDataPathOwnerKind,
  getDataPathOwnerKindByItemType,
  getOwnerKindByMetadataLinkPrefix,
} from "./dataPath/registry"
import { validatePendingChecks } from "./projectValidationPendingChecks"
import { createProjectDegradationDiagnostics } from "./projectFirstPassReadiness"
import type { ProjectStateFieldEntry, ProjectStateFormEntry } from "../projectState/contracts/fileUpdate"
import type {
  ProjectDependencyInput,
  ProjectDependencyInputQuery,
  ProjectDependencyOwnerInput,
  ProjectDependencyInputResult,
  ProjectDataPathReferenceLocation,
  ProjectStateQueryPort,
} from "../projectState/contracts/dependencyValidation"
import type { ProjectStatePendingDependencyCheck } from "../projectState/contracts/fileUpdate"
import { parseProjectPath, projectPathFromFileSystem } from "../project/path"
import type { ProjectStateDependencyValidator } from "../projectState/contracts/dependencyValidation"
import { getRegisteredFormDataPathMetadataProjection } from "./formDataPathProjectionRegistry"

export function createProjectStateDependencyValidator(): ProjectStateDependencyValidator {
  return {
    readReadiness: readProjectStateDependencyReadiness,
    resolveDataPaths: (params) => resolveProjectStateDataPathReferenceBatch(params)
      .filter((reference) => reference.target.source.kind === "objectField")
      .map((reference) => ({
        requestId: reference.requestId,
        componentPath: reference.componentPath,
        projectPath: reference.projectPath,
        resolvedSegments: reference.target.segments,
        sourceOwner: reference.target.source.kind === "objectField" ? reference.target.source.owner : { kind: "" },
        ...(reference.target.source.kind === "objectField" ? { sourceFieldName: reference.target.source.name } : {}),
      })),
    validateReferences: validateProjectStateReferenceBatch,
    validateOwners: validateProjectStateOwnerBatch,
    validateDependencies: validateProjectStateDependencyBatch,
  }
}

export interface ProjectStateDataPathReferenceCheck {
  readonly requestId: string
  readonly componentPath: string
  readonly projectPath: string
  readonly check: ProjectStatePendingDependencyCheck
}

export interface ProjectStateResolvedDataPathReference {
  readonly requestId: string
  readonly componentPath: string
  readonly projectPath: string
  readonly check: ProjectStatePendingDependencyCheck
  readonly target: ResolvedDataPathTarget
}

export function projectStateDataPathReferenceLocation(
  reference: ProjectStateResolvedDataPathReference,
): ProjectDataPathReferenceLocation {
  return {
    kind: "dataPath",
    projectPath: reference.projectPath,
    componentPath: reference.componentPath,
    yamlPath: reference.check.yamlPath,
    value: reference.check.value,
    resolvedSegments: reference.target.segments,
    segmentIndex: reference.target.segments.length - 1,
  }
}

export function resolveProjectStateDataPathReferenceBatch(params: {
  readonly checks: readonly ProjectStateDataPathReferenceCheck[]
  readonly projectDir: string
  readonly queryPort: Pick<ProjectStateQueryPort, "readDependencyInputs" | "readDependencyOwnerInputs">
}): readonly ProjectStateResolvedDataPathReference[] {
  if (params.checks.length === 0) return []
  const inputs = params.queryPort.readDependencyInputs(params.checks.map(({ requestId, componentPath, projectPath, check }) => ({
    requestId,
    componentPath,
    projectPath,
    check,
  })))
  const owners = preloadDataPathOwners(params.queryPort, params.checks, inputs)
  const resolved: ProjectStateResolvedDataPathReference[] = []
  forEachDependencyResult(params.checks, inputs, (check, result) => {
    if (result.status !== "found") return
    const resolution = resolveDataPath({
      location: { ...check.check.location, filePath: check.projectPath },
      value: check.check.value,
      index: dependencyFormIndex(result.input.forms),
      ownerCache: preloadedOwnerCache({
        projectDir: `${params.projectDir}/${check.componentPath}`,
        componentPath: check.componentPath,
        owners,
      }),
      ...(check.check.tableContext === undefined ? {} : { tableContext: check.check.tableContext }),
    })
    if (resolution.status !== "error" && resolution.target !== undefined) {
      resolved.push({ ...check, target: resolution.target })
    }
  })
  return resolved
}

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
    }).map((diagnostic) => ({ ...diagnostic, filePath: parseProjectPath(diagnostic.filePath) })),
  }
}

export function validateProjectStateReferenceBatch(params: {
  readonly checks: readonly ProjectStatePendingReferenceCheck[]
  readonly projectDir: string
  readonly queryPort: Pick<ProjectStateQueryPort, "resolveTargets" | "readOwners">
}): readonly Diagnostic[] {
  const results = params.queryPort.resolveTargets(
    params.checks.map(({ requestId, componentPath, reference }) => ({
      requestId,
      componentPath,
      canonicalTarget: reference.canonical,
    })),
  )
  const resultByRequestId = new Map(results.map((result) => [result.requestId, result]))
  const valueOwnerChecks = params.checks.filter(({ requestId, reference }) =>
    resultByRequestId.get(requestId)?.status === "missing" && reference.target.kind === "value"
  )
  const valueOwnerResults = params.queryPort.readOwners(
    valueOwnerChecks.map(({ requestId, componentPath, reference }) => {
      if (reference.target.kind !== "value") throw new Error("Ожидалась ссылка на значение")
      return {
        requestId,
        componentPath,
        owner: valueTargetOwner(reference.target),
      }
    }),
  )
  const valueOwnerResultByRequestId = new Map(valueOwnerResults.map((result) => [result.requestId, result]))
  const diagnostics: Diagnostic[] = []
  forEachDependencyResult(params.checks, results, (check, result) => {
    if (result.status === "found") {
      const resolved = resolvedProjectReferenceResult(check.reference, result.target.details)
      if (!resolved.ok) diagnostics.push(...resolved.diagnostics)
    } else {
      if (result.status === "missing" && check.reference.target.kind === "value") {
        const ownerResult = valueOwnerResultByRequestId.get(check.requestId)
        if (ownerResult?.status === "found") {
          if (check.reference.target.valueKind === "emptyRef") return
          const ownerRef = valueTargetOwner(check.reference.target)
          const owner = ownerMetadataFromFacts({
            projectDir: join(params.projectDir, check.componentPath),
            ref: ownerRef,
            facts: ownerResult.facts,
            fieldIndex: projectStateFieldIndex(ownerRef, []),
          })
          if (owner.status === "ok") {
            const contributed = getProjectReferenceValueContributor(check.reference.target.root)?.({
              owner: owner.owner,
              target: check.reference.target,
            })
            if (contributed?.ok === true) return
            if (contributed?.ok === false) {
              diagnostics.push(...contributed.diagnostics)
              return
            }
          }
        } else if (ownerResult?.status === "ambiguous") {
          diagnostics.push(...unresolvedProjectReferenceResult(check.reference, "ambiguous").diagnostics)
          return
        }
      }
      const objectFilePath = check.reference.target.kind === "object"
        ? getProjectReferenceObjectPathContributor(check.reference.target.root)?.({
            projectDir: join(params.projectDir, check.componentPath),
            target: check.reference.target,
          })?.filePath
        : undefined
      const objectProjectPath = objectFilePath === undefined
        ? undefined
        : projectPathFromFileSystem(params.projectDir, objectFilePath)
      diagnostics.push(...unresolvedProjectReferenceResult(check.reference, result.status, objectProjectPath).diagnostics)
    }
  })
  return diagnostics
}

function valueTargetOwner(target: Extract<PendingMetadataTargetReference["target"], { kind: "value" }>): OwnerTypeRef {
  return {
    kind: getOwnerKindByMetadataLinkPrefix(target.root) ?? target.root,
    name: target.objectName,
  }
}

export function validateProjectStateOwnerBatch(params: {
  readonly checks: readonly ProjectStatePendingOwnerCheck[]
  readonly projectDir: string
  readonly queryPort: Pick<ProjectStateQueryPort, "readOwners">
}): readonly Diagnostic[] {
  const checks = uniqueOwnerChecks(params.checks)
  const results = params.queryPort.readOwners(
    checks.map(({ requestId, componentPath, owner }) => ({ requestId, componentPath, owner })),
  )
  const diagnostics: Diagnostic[] = []
  forEachDependencyResult(checks, results, (check, result) => {
    if (result.status !== "missing") return
    diagnostics.push(
      ...ownerMetadataNotFound({
        projectDir: `${params.projectDir}/${check.componentPath}`,
        ref: check.owner,
      }).diagnostics,
    )
  })
  return diagnostics
}

function uniqueOwnerChecks(
  checks: readonly ProjectStatePendingOwnerCheck[],
): readonly ProjectStatePendingOwnerCheck[] {
  const seen = new Set<string>()
  return checks.filter((check) => {
    const key = componentOwnerKey(check.componentPath, check.owner)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function validateProjectStateDependencyBatch(params: {
  readonly checks: readonly ProjectDependencyInputQuery[]
  readonly projectDir: string
  readonly queryPort: Pick<
    ProjectStateQueryPort,
    "readDependencyInputs" | "readDependencyOwnerInputs" | "readOwnerRefPage"
  >
}): readonly Diagnostic[] {
  const groups = groupDependencyChecksByFile(params.checks)
  const requests = groups.map((group) => group[0]!)
  const results = params.queryPort.readDependencyInputs(requests)
  const diagnostics: Diagnostic[] = []
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const group = groups[groupIndex]!
    const request = requests[groupIndex]!
    const result = results[groupIndex]
    if (result === undefined || result.requestId !== request.requestId) {
      throw new Error(`Ответ dependency lookup не соответствует запросу ${request.requestId}`)
    }
    if (result.status !== "found") continue
    const index = dependencyFormIndex(result.input.forms)
    diagnostics.push(
      ...validatePendingChecks({
        ownerCache: createProjectStateOwnerMetadataCache({
          initialInput: result.input,
          projectDir: `${params.projectDir}/${request.componentPath}`,
          componentPath: request.componentPath,
          queryPort: params.queryPort,
        }),
        checks: group.map((check) => ({
            ...check.check,
            location: { ...check.check.location, filePath: check.projectPath },
            index,
          })),
      }).diagnostics,
    )
  }
  return diagnostics
}

function groupDependencyChecksByFile(
  checks: readonly ProjectDependencyInputQuery[],
): readonly (readonly ProjectDependencyInputQuery[])[] {
  const groups = new Map<string, ProjectDependencyInputQuery[]>()
  for (const check of checks) {
    const key = `${check.componentPath}\u0000${check.projectPath}`
    const group = groups.get(key)
    if (group === undefined) groups.set(key, [check])
    else group.push(check)
  }
  return [...groups.values()]
}

function forEachDependencyResult<
  TCheck extends { readonly requestId: string },
  TResult extends { readonly requestId: string },
>(
  checks: readonly TCheck[],
  results: readonly TResult[],
  visit: (check: TCheck, result: TResult) => void,
): void {
  for (let index = 0; index < checks.length; index += 1) {
    const check = checks[index]!
    const result = results[index]
    if (result === undefined || result.requestId !== check.requestId) {
      throw new Error(`Ответ dependency lookup не соответствует запросу ${check.requestId}`)
    }
    visit(check, result)
  }
}

export interface ProjectStateOwnerMetadataCache extends OwnerMetadataCache {
  preload(refs: readonly OwnerTypeRef[]): void
}

export function createProjectStateOwnerMetadataCache(params: {
  initialInput?: ProjectDependencyInput
  projectDir: string
  componentPath: string
  queryPort: Pick<ProjectStateQueryPort, "readDependencyOwnerInputs" | "readOwnerRefPage">
}): ProjectStateOwnerMetadataCache {
  const currentOwners = new Map<string, ProjectDependencyOwnerInput>(
    (params.initialInput?.owners ?? []).map(({ owner, facts }) => [
      ownerKey(owner),
      { owner, facts, fields: projectStateFields(owner, params.initialInput?.fields ?? []) },
    ]),
  )
  const missingOwners = new Set<string>()
  let activePage: ReadonlyMap<string, ProjectDependencyOwnerInput> | undefined
  return {
    get(ref) {
      const exactKey = ownerKey(ref)
      const fallbackRef = canonicalProjectStateOwnerRef(ref)
      const fallbackKey = ownerKey(fallbackRef)
      const exact = currentOwners.get(exactKey) ?? activePage?.get(exactKey)
        ?? (missingOwners.has(exactKey) ? undefined : readOwner(ref))
      const stored = exact ?? (fallbackKey === exactKey
        ? undefined
        : currentOwners.get(fallbackKey) ?? activePage?.get(fallbackKey)
          ?? (missingOwners.has(fallbackKey) ? undefined : readOwner(fallbackRef)))
      if (stored === undefined) return ownerMetadataNotFound({ projectDir: params.projectDir, ref })
      return ownerMetadataFromFacts({
        projectDir: params.projectDir,
        ref,
        facts: stored.facts,
        fieldIndex: projectStateFieldIndex(stored.owner, stored.fields),
      })
    },
    listRefs(kind) {
      return visibleOwnerRefs(kind)
    },
    preload(refs) {
      const unique = [...new Map(refs.map(canonicalProjectStateOwnerRef).map((ref) => [ownerKey(ref), ref])).values()]
        .filter((ref) => !currentOwners.has(ownerKey(ref)))
      if (unique.length === 0) return
      const requests = unique.map((owner, index) => ({
        requestId: `sync-owner:${index}`,
        componentPath: params.componentPath,
        owner,
      }))
      const results = params.queryPort.readDependencyOwnerInputs(requests)
      forEachDependencyResult(requests, results, (_request, result) => {
        if (result.status === "found") currentOwners.set(ownerKey(result.input.owner), result.input)
        else missingOwners.add(ownerKey(_request.owner))
      })
    },
  }

  function readOwner(ref: OwnerTypeRef): ProjectDependencyOwnerInput | undefined {
    const requestId = ownerKey(ref)
    const result = params.queryPort.readDependencyOwnerInputs([
      { requestId, componentPath: params.componentPath, owner: ref },
    ])[0]
    if (result === undefined || result.requestId !== requestId) {
      throw new Error(`Ответ dependency owner lookup не соответствует запросу ${requestId}`)
    }
    if (result.status === "found") return result.input
    missingOwners.add(ownerKey(ref))
    return undefined
  }

  function* visibleOwnerRefs(kind: OwnerTypeRef["kind"]): IterableIterator<OwnerTypeRef> {
    const storedKind = canonicalProjectStateOwnerRef({ kind }).kind
    let cursor: string | undefined
    for (;;) {
      const page = params.queryPort.readOwnerRefPage({
        componentPath: params.componentPath,
        kind: storedKind,
        ...(cursor === undefined ? {} : { cursor }),
      })
      if (page.refs.length === 0 && page.nextCursor !== undefined) {
        throw new Error("Пустая страница владельцев не может содержать следующий cursor")
      }
      const requests = page.refs.map((owner, index) => ({
        requestId: `page:${index}`,
        componentPath: params.componentPath,
        owner,
      }))
      const inputs = params.queryPort.readDependencyOwnerInputs(requests)
      const pageOwners = new Map<string, ProjectDependencyOwnerInput>()
      forEachDependencyResult(requests, inputs, (_request, result) => {
        if (result.status === "found") pageOwners.set(ownerKey(result.input.owner), result.input)
      })
      activePage = pageOwners
      try {
        for (const ref of page.refs) {
          if (pageOwners.has(ownerKey(ref))) yield { ...ref, kind }
        }
      } finally {
        activePage = undefined
      }
      if (page.nextCursor === undefined) return
      if (page.nextCursor === cursor) throw new Error("Страница владельцев повторила cursor")
      cursor = page.nextCursor
    }
  }
}

function canonicalProjectStateOwnerRef(ref: OwnerTypeRef): OwnerTypeRef {
  const registration = getDataPathOwnerKind(ref.kind)
  const kind = registration === undefined
    ? ref.kind
    : getDataPathOwnerKindByItemType(registration.rule.itemType)?.kind ?? registration.kind
  return kind === ref.kind ? ref : { ...ref, kind }
}

function projectStateFields(
  owner: OwnerTypeRef,
  entries: readonly ProjectStateFieldEntry[],
): readonly ProjectStateFieldEntry[] {
  const key = ownerKey(owner)
  return entries.filter((entry) => ownerKey(entry.owner) === key)
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
  const tabularElementsByName = new Map<string, {
    readonly kind: "tabularFormElement"
    readonly dataPath?: string
  }>()
  for (const entry of entries) {
    if (entry.kind === "tabularElement") {
      if (!tabularElementsByName.has(entry.name)) {
        tabularElementsByName.set(entry.name, {
          kind: "tabularFormElement",
          ...(entry.dataPath === undefined ? {} : { dataPath: entry.dataPath }),
        })
      }
      continue
    }
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
  const dialect = getRegisteredFormDataPathMetadataProjection()?.dataPathDialect
  return {
    roots,
    additionalColumnsByTablePath,
    tabularElementsByName,
    ...(dialect === undefined ? {} : { dialect }),
    duplicateDiagnostics: [],
    getRoot(name) {
      return roots.get(name)
    },
  }
}

function ownerKey(ref: OwnerTypeRef): string {
  return `${ref.kind}:${ref.name ?? ""}`
}

function preloadDataPathOwners(
  queryPort: Pick<ProjectStateQueryPort, "readDependencyOwnerInputs">,
  checks: readonly ProjectStateDataPathReferenceCheck[],
  inputs: readonly ProjectDependencyInputResult[],
): ReadonlyMap<string, ProjectDependencyOwnerInput> {
  const owners = new Map<string, ProjectDependencyOwnerInput>()
  const pending = new Map<string, { readonly componentPath: string; readonly owner: OwnerTypeRef }>()
  forEachDependencyResult(checks, inputs, (check, result) => {
    if (result.status !== "found") return
    for (const stored of result.input.owners) {
      const input = {
        owner: stored.owner,
        facts: stored.facts,
        fields: projectStateFields(stored.owner, result.input.fields),
      }
      owners.set(componentOwnerKey(check.componentPath, stored.owner), input)
      enqueueReferencedOwners(pending, check.componentPath, input.fields)
    }
    enqueueFormOwners(pending, check.componentPath, result.input.forms)
  })

  while (pending.size > 0) {
    const batch = [...pending.values()].filter(({ componentPath, owner }) =>
      !owners.has(componentOwnerKey(componentPath, owner)))
    pending.clear()
    if (batch.length === 0) break
    const requests = batch.map(({ componentPath, owner }, index) => ({
      requestId: `data-path-owner:${index}`,
      componentPath,
      owner,
    }))
    const results = queryPort.readDependencyOwnerInputs(requests)
    forEachDependencyResult(requests, results, (request, result) => {
      if (result.status !== "found") return
      owners.set(componentOwnerKey(request.componentPath, result.input.owner), result.input)
      enqueueReferencedOwners(pending, request.componentPath, result.input.fields)
    })
  }
  return owners
}

function enqueueFormOwners(
  pending: Map<string, { readonly componentPath: string; readonly owner: OwnerTypeRef }>,
  componentPath: string,
  forms: readonly ProjectStateFormEntry[],
): void {
  for (const form of forms) {
    if (form.kind === "tabularElement") continue
    enqueueTypeOwners(pending, componentPath, form.source.typeInfo.nextTypes)
    if ("table" in form.source && (form.source.table?.kind === "RegisterRecordSet" || form.source.table?.kind === "TabularSection")) {
      enqueueTypeOwners(pending, componentPath, [form.source.table.owner])
    }
  }
}

function enqueueReferencedOwners(
  pending: Map<string, { readonly componentPath: string; readonly owner: OwnerTypeRef }>,
  componentPath: string,
  fields: readonly ProjectStateFieldEntry[],
): void {
  for (const field of fields) {
    enqueueTypeOwners(pending, componentPath, field.typeInfo.nextTypes)
    if (field.table?.kind === "RegisterRecordSet" || field.table?.kind === "TabularSection") {
      enqueueTypeOwners(pending, componentPath, [field.table.owner])
    }
  }
}

function enqueueTypeOwners(
  pending: Map<string, { readonly componentPath: string; readonly owner: OwnerTypeRef }>,
  componentPath: string,
  refs: readonly OwnerTypeRef[],
): void {
  for (const owner of refs) pending.set(componentOwnerKey(componentPath, owner), { componentPath, owner })
}

function preloadedOwnerCache(params: {
  readonly projectDir: string
  readonly componentPath: string
  readonly owners: ReadonlyMap<string, ProjectDependencyOwnerInput>
}): OwnerMetadataCache {
  return {
    get(ref) {
      const stored = params.owners.get(componentOwnerKey(params.componentPath, ref))
      return stored === undefined
        ? ownerMetadataNotFound({ projectDir: params.projectDir, ref })
        : ownerMetadataFromFacts({
            projectDir: params.projectDir,
            ref,
            facts: stored.facts,
            fieldIndex: projectStateFieldIndex(ref, stored.fields),
          })
    },
    listRefs(kind) {
      return [...params.owners.values()]
        .map(({ owner }) => owner)
        .filter((owner) => owner.kind === kind)
    },
  }
}

function componentOwnerKey(componentPath: string, owner: OwnerTypeRef): string {
  return `${componentPath}\u0000${ownerKey(owner)}`
}
