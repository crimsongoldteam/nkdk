import { join } from "node:path"
import {
  referenceNotIncludedInExtensionResult,
  resolvedProjectReferenceResult,
  unresolvedProjectReferenceResult,
  type PendingMetadataTargetReference,
} from "./projectReferenceIndex"
import {
  getProjectReferenceObjectPathContributor,
  getProjectReferenceValueContributor,
} from "./projectReferenceIndexRegistry"
import { yamlPathToPointer, type Diagnostic } from "@nkdk/runtime"
import {
  ownerMetadataFromFacts,
  ownerMetadataNotFound,
  ownerMetadataProjectPath,
  type OwnerMetadataCache,
} from "./dataPath/ownerCache"
import type { FormDataPathSource, OwnerTypeRef } from "./dataPath/types"
import type { ResolvedDataPathTarget } from "./dataPath/resolver"
import { resolveDataPathCore, type ResolveDataPathCoreResult } from "./dataPath/coreResolver"
import { projectStateFieldIndex } from "./dataPath/projectStateFieldIndex"
import type { FormDataPathIndex } from "./dataPath/formIndex"
import {
  getDataPathOwnerKind,
  getDataPathOwnerKindByItemType,
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
import { projectPathFromFileSystem } from "../projectDefinition/path"
import type { ProjectStateDependencyValidator } from "../projectState/contracts/dependencyValidation"
import type {
  ProjectStateSemanticValidationResult,
  ProjectStateXmlAnomalyBoundary,
} from "../projectState/contracts/dependencyValidation"
import type { ProjectStateStructuredDocumentValidator } from "../projectState/contracts/dependencyValidation"
import { getRegisteredFormDataPathMetadataProjection } from "./formDataPathProjectionRegistry"
import { diagnosticAtYamlLocation } from "./yamlLocations"
import type { ProjectStateAddressableRequiredCheck } from "../projectState/contracts/dependencyValidation"
import type { ProjectStateReferenceCoverageCheck } from "../projectState/contracts/dependencyValidation"
import type { DataTableDeclarationContributor } from "./dataTables"
import { validateProjectStateDataTableReferenceBatch } from "./dataTables/projectState"
import type { DataTableRegistrySet } from "./dataTables/registry"
import { currentValidationRegistrySet } from "./validationExecutionContext"
import { resolveProjectValueTargets } from "./projectReferenceValueResolver"
import { assertProjectDiagnosticPaths } from "../projectState/diagnosticPaths"

export function createProjectStateDependencyValidator(params: {
  readonly structuredDocumentValidators?: readonly ProjectStateStructuredDocumentValidator[]
  readonly dataTableContributors?: readonly DataTableDeclarationContributor[]
} = {}): ProjectStateDependencyValidator {
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
    validateReferences: (validationParams) => validateProjectStateReferenceBatchResult({
      ...validationParams,
      dataTableContributors: params.dataTableContributors
        ?? currentValidationRegistrySet<{ dataTables: DataTableRegistrySet }>()?.dataTables.contributors
        ?? [],
    }),
    validateOwners: validateProjectStateOwnerBatch,
    validateDependencies: validateProjectStateDependencyBatchResult,
    validateAddressableRequired: validateProjectStateAddressableRequiredBatch,
    validateReferenceCoverage: validateProjectStateReferenceCoverageBatch,
    validateStructuredDocuments: (validationParams) =>
      (params.structuredDocumentValidators ?? []).flatMap((validator) => assertProjectDiagnosticPaths(
        validator(validationParams),
        validator.name || "Structured document validator",
      )),
  }
}

export function validateProjectStateReferenceCoverageBatch(params: {
  readonly checks: readonly ProjectStateReferenceCoverageCheck[]
  readonly projectDir: string
  readonly queryPort: Pick<ProjectStateQueryPort, "resolveTargets">
}): readonly Diagnostic[] {
  const requests = params.checks.flatMap((entry, checkIndex) =>
    entry.check.requirements.flatMap((requirement, requirementIndex) =>
      [...new Set(requirement.candidates)].map((canonicalTarget, targetIndex) => ({
        requestId: `coverage:${checkIndex}:${requirementIndex}:${targetIndex}`,
        componentPath: entry.componentPath,
        canonicalTarget,
      }))))
  const results = params.queryPort.resolveTargets(requests)
  const statuses = new Map(results.map((result) => [result.requestId, result.status]))
  const diagnostics: Diagnostic[] = []
  for (const [checkIndex, entry] of params.checks.entries()) {
    for (const [requirementIndex, requirement] of entry.check.requirements.entries()) {
      const targets = [...new Set(requirement.candidates)]
      const targetStatuses = new Map(targets.map((target, targetIndex) => [
        target,
        statuses.get(`coverage:${checkIndex}:${requirementIndex}:${targetIndex}`),
      ]))
      const participates = requirement.candidates.some((target) => targetStatuses.get(target) === "found")
      const covered = requirement.coveredBy.length > 0
      if (!participates || covered) continue
      diagnostics.push(diagnosticAtYamlLocation({
        location: { ...entry.check.location, filePath: entry.projectPath },
        severity: "error",
        source: "cross-file",
        message: requirement.message,
      }))
    }
  }
  return diagnostics
}

export function validateProjectStateAddressableRequiredBatch(params: {
  readonly checks: readonly ProjectStateAddressableRequiredCheck[]
  readonly projectDir: string
  readonly queryPort: Pick<ProjectStateQueryPort, "resolveTargets">
}): readonly Diagnostic[] {
  const results = params.queryPort.resolveTargets(params.checks.map(({ requestId, check }) => ({
    requestId,
    componentPath: "cf",
    canonicalTarget: check.canonicalTarget,
  })))
  const diagnostics: Diagnostic[] = []
  forEachDependencyResult(params.checks, results, (entry, result) => {
    if (result.status === "found") return
    const location = {
      ...entry.check.location,
      filePath: entry.projectPath,
    }
    if (result.status === "ambiguous") {
      diagnostics.push(diagnosticAtYamlLocation({
        location,
        severity: "error",
        source: "cross-file",
        message: `Неоднозначная цель metadata "${entry.check.canonicalTarget}" в базовой конфигурации`,
      }))
    }
    diagnostics.push(...entry.check.missing.map((name) => diagnosticAtYamlLocation({
      location: { ...location, path: `${entry.check.location.path ?? ""}/${escapeYamlPointer(name)}` },
      severity: "error",
      source: "structure",
      message: `Отсутствует обязательное свойство "${name}"`,
    })))
  })
  return diagnostics
}

function escapeYamlPointer(value: string): string {
  return value.replace(/~/g, "~0").replace(/\//g, "~1")
}

export interface ProjectStateDataPathReferenceCheck {
  readonly requestId: string
  readonly componentPath: string
  readonly projectPath: string
  readonly check: Extract<ProjectStatePendingDependencyCheck, { kind: "dataPath" }>
}

export interface ProjectStateResolvedDataPathReference {
  readonly requestId: string
  readonly componentPath: string
  readonly projectPath: string
  readonly check: Extract<ProjectStatePendingDependencyCheck, { kind: "dataPath" }>
  readonly target: ResolvedDataPathTarget
}

export interface ProjectStateDataPathReferenceResult {
  readonly requestId: string
  readonly componentPath: string
  readonly projectPath: string
  readonly check: Extract<ProjectStatePendingDependencyCheck, { kind: "dataPath" }>
  readonly resolution: ResolveDataPathCoreResult
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
  return resolveProjectStateDataPathReferenceResultBatch(params).flatMap((result) =>
    result.resolution.status !== "error" && result.resolution.target !== undefined
      ? [{
          requestId: result.requestId,
          componentPath: result.componentPath,
          projectPath: result.projectPath,
          check: result.check,
          target: result.resolution.target,
        }]
      : []
  )
}

export function resolveProjectStateDataPathReferenceResultBatch(params: {
  readonly checks: readonly ProjectStateDataPathReferenceCheck[]
  readonly projectDir: string
  readonly queryPort: Pick<ProjectStateQueryPort, "readDependencyInputs" | "readDependencyOwnerInputs">
}): readonly ProjectStateDataPathReferenceResult[] {
  if (params.checks.length === 0) return []
  const inputs = params.queryPort.readDependencyInputs(params.checks.map(({ requestId, componentPath, projectPath, check }) => ({
    requestId,
    componentPath,
    projectPath,
    check,
  })))
  const owners = preloadDataPathOwners(params.queryPort, params.checks, inputs)
  const resolved: ProjectStateDataPathReferenceResult[] = []
  forEachDependencyResult(params.checks, inputs, (check, result) => {
    if (result.status !== "found") return
    const resolution = resolveDataPathCore({
      value: check.check.value,
      index: dependencyFormIndex(result.input.forms),
      ownerCache: preloadedOwnerCache({
        projectDir: `${params.projectDir}/${check.componentPath}`,
        componentPath: check.componentPath,
        owners,
      }),
      ...(check.check.tableContext === undefined ? {} : { tableContext: check.check.tableContext }),
      nameMode: "yaml",
    })
    resolved.push({ ...check, resolution })
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
      if (row.schemaReady === false || row.contributedFacts === false) {
        configurationFilesReady = false
      }
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
      hasConfiguration,
      blockedComponentPaths: [...blockedComponentPaths],
    }),
  }
}

export function validateProjectStateReferenceBatch(params: {
  readonly checks: readonly ProjectStatePendingReferenceCheck[]
  readonly projectDir: string
  readonly queryPort: Pick<
    ProjectStateQueryPort,
    "resolveTargets" | "readOwners"
  > & Partial<Pick<ProjectStateQueryPort, "readDependencyOwnerInputs" | "readOwnerRefPage">>
  readonly dataTableContributors?: readonly DataTableDeclarationContributor[]
}): readonly Diagnostic[] {
  return validateProjectStateReferenceBatchResult(params).diagnostics
}

export function validateProjectStateReferenceBatchResult(params: {
  readonly checks: readonly ProjectStatePendingReferenceCheck[]
  readonly projectDir: string
  readonly queryPort: Pick<
    ProjectStateQueryPort,
    "resolveTargets" | "readOwners"
  > & Partial<Pick<ProjectStateQueryPort, "readDependencyOwnerInputs" | "readOwnerRefPage">>
  readonly dataTableContributors?: readonly DataTableDeclarationContributor[]
}): ProjectStateSemanticValidationResult {
  const acceptedChecks = params.checks.filter(({ reference }) => reference.xmlAnomaly === "accepted")
  const activeChecks = params.checks.filter(({ reference }) => reference.xmlAnomaly !== "accepted")
  const dataTableChecks = activeChecks.filter(({ reference }) => reference.target.kind === "dataTable")
  const ordinaryChecks = activeChecks.filter(({ reference }) => reference.target.kind !== "dataTable")
  const dataTableDiagnostics = dataTableChecks.length === 0
    ? []
    : validateProjectStateDataTableReferenceBatch({
        checks: dataTableChecks,
        projectDir: params.projectDir,
        queryPort: requireDataTableQueryPort(params.queryPort),
        contributors: params.dataTableContributors ?? [],
      })
  const results = ordinaryChecks.length === 0
    ? []
    : params.queryPort.resolveTargets(
        ordinaryChecks.map(({ requestId, componentPath, reference }) => ({
          requestId,
          componentPath,
          canonicalTarget: reference.canonical,
        })),
      )
  const resultByRequestId = new Map(results.map((result) => [result.requestId, result]))
  const basePresenceChecks = ordinaryChecks.filter(({ requestId, componentPath, reference }) =>
    componentPath.startsWith("cfe/")
    && componentPath.length > "cfe/".length
    && (resultByRequestId.get(requestId)?.status === "missing"
      || reference.propertyStateMode === "control"
      || reference.propertyStateMode === "notify")
  )
  const basePresenceResults = basePresenceChecks.length === 0
    ? []
    : params.queryPort.resolveTargets(
        basePresenceChecks.map(({ requestId, reference }) => ({
          requestId,
          componentPath: "cf",
          canonicalTarget: reference.canonical,
        })),
      )
  const basePresenceByRequestId = new Map(
    basePresenceResults.map((result) => [result.requestId, result]),
  )
  const valueOwnerChecks = ordinaryChecks.filter(({ requestId, reference }) =>
    resultByRequestId.get(requestId)?.status === "missing"
    && reference.target.kind === "value"
  )
  const valueResults = valueOwnerChecks.length === 0
    ? []
    : resolveProjectValueTargets({
        requests: valueOwnerChecks.map(({ requestId, componentPath, reference }) => {
          if (reference.target.kind !== "value") throw new Error("Ожидалась ссылка на значение")
          return { requestId, componentPath, target: reference.target }
        }),
        projectDir: params.projectDir,
        queryPort: params.queryPort,
        getContributor: getProjectReferenceValueContributor,
      })
  const valueResultByRequestId = new Map(valueResults.map((result) => [result.requestId, result]))
  const diagnostics: Diagnostic[] = [...dataTableDiagnostics]
  forEachDependencyResult(ordinaryChecks, results, (check, result) => {
    let problems: readonly Diagnostic[] = []
    if (result.status === "found") {
      const baseResult = basePresenceByRequestId.get(check.requestId)
      if (check.reference.propertyStateMode !== undefined
        && check.reference.propertyStateMode !== "extend"
        && baseResult?.status !== "found") {
        problems = unresolvedProjectReferenceResult(
          check.reference,
          baseResult?.status ?? "missing",
        ).diagnostics
      } else {
        const resolved = resolvedProjectReferenceResult(check.reference, result.target.details)
        if (!resolved.ok) problems = resolved.diagnostics
      }
    } else {
      if (result.status === "missing" && check.reference.target.kind === "value") {
        const valueResult = valueResultByRequestId.get(check.requestId)
        if (valueResult?.status === "found") {
          problems = []
        } else if (valueResult?.status === "invalid") {
          problems = valueResult.diagnostics
        } else if (valueResult?.status === "ambiguous") {
          problems = unresolvedProjectReferenceResult(check.reference, "ambiguous").diagnostics
        } else if (basePresenceByRequestId.get(check.requestId)?.status === "found") {
          problems = referenceNotIncludedInExtensionResult(check.reference).diagnostics
        } else {
          problems = unresolvedReferenceDiagnostics(params.projectDir, check, result.status)
        }
      } else if (result.status === "missing" && basePresenceByRequestId.get(check.requestId)?.status === "found") {
        problems = referenceNotIncludedInExtensionResult(check.reference).diagnostics
      } else {
        problems = unresolvedReferenceDiagnostics(params.projectDir, check, result.status)
      }
    }
    diagnostics.push(...problems)
  })
  return acceptProjectStateReferenceDiagnostics({
    checks: activeChecks,
    diagnostics,
    acceptedXmlAnomalies: acceptedChecks.map(projectStateReferenceBoundary),
  })
}

function unresolvedReferenceDiagnostics(
  projectDir: string,
  check: ProjectStatePendingReferenceCheck,
  status: "missing" | "ambiguous",
): readonly Diagnostic[] {
  const objectFilePath = check.reference.target.kind === "object"
    ? getProjectReferenceObjectPathContributor(check.reference.target.root)?.({
        projectDir: join(projectDir, check.componentPath),
        target: check.reference.target,
      })?.filePath
    : undefined
  const objectProjectPath = objectFilePath === undefined
    ? undefined
    : projectPathFromFileSystem(projectDir, objectFilePath)
  return unresolvedProjectReferenceResult(check.reference, status, objectProjectPath).diagnostics
}

function acceptProjectStateReferenceDiagnostics(params: {
  readonly checks: readonly ProjectStatePendingReferenceCheck[]
  readonly diagnostics: readonly Diagnostic[]
  readonly acceptedXmlAnomalies: readonly ProjectStateXmlAnomalyBoundary[]
}): ProjectStateSemanticValidationResult {
  const accepted = [...params.acceptedXmlAnomalies]
  const acceptedDiagnosticKeys = new Set<string>()
  for (const check of params.checks) {
    if (check.reference.xmlAnomaly !== "pending") continue
    const path = yamlPathToPointer(check.reference.yamlPath)
    const matched = params.diagnostics.filter((diagnostic) =>
      diagnostic.severity === "error"
      && diagnostic.filePath === check.reference.filePath
      && diagnostic.path === path)
    if (matched.length === 0) continue
    accepted.push(projectStateReferenceBoundary(check))
    for (const diagnostic of matched) acceptedDiagnosticKeys.add(projectStateDiagnosticKey(diagnostic))
  }
  return {
    diagnostics: params.diagnostics.filter((diagnostic) =>
      !acceptedDiagnosticKeys.has(projectStateDiagnosticKey(diagnostic))),
    acceptedXmlAnomalies: accepted,
  }
}

function projectStateReferenceBoundary(check: ProjectStatePendingReferenceCheck): ProjectStateXmlAnomalyBoundary {
  return {
    componentPath: check.componentPath,
    projectPath: check.reference.filePath,
    yamlPath: check.reference.yamlPath,
  }
}

function projectStateDiagnosticKey(diagnostic: Diagnostic): string {
  return `${diagnostic.filePath}\u0000${diagnostic.path ?? ""}\u0000${diagnostic.source}\u0000${diagnostic.message}`
}

function requireDataTableQueryPort(
  queryPort: Pick<ProjectStateQueryPort, "resolveTargets">
    & Partial<Pick<ProjectStateQueryPort, "readDependencyOwnerInputs" | "readOwnerRefPage">>,
): Pick<ProjectStateQueryPort, "resolveTargets" | "readDependencyOwnerInputs" | "readOwnerRefPage"> {
  if (queryPort.readDependencyOwnerInputs === undefined || queryPort.readOwnerRefPage === undefined) {
    throw new Error("Проверка таблиц данных требует доступ к фактам владельцев проекта")
  }
  return {
    resolveTargets: queryPort.resolveTargets.bind(queryPort),
    readDependencyOwnerInputs: queryPort.readDependencyOwnerInputs.bind(queryPort),
    readOwnerRefPage: queryPort.readOwnerRefPage.bind(queryPort),
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
        filePath: ownerMetadataProjectPath(check.componentPath, check.owner),
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
  return validateProjectStateDependencyBatchResult(params).diagnostics
}

export function validateProjectStateDependencyBatchResult(params: {
  readonly checks: readonly ProjectDependencyInputQuery[]
  readonly projectDir: string
  readonly queryPort: Pick<
    ProjectStateQueryPort,
    "readDependencyInputs" | "readDependencyOwnerInputs" | "readOwnerRefPage"
  >
}): ProjectStateSemanticValidationResult {
  const acceptedChecks = params.checks.filter(({ check }) => check.xmlAnomaly === "accepted")
  const groups = groupDependencyChecksByFile(
    params.checks.filter(({ check }) => check.xmlAnomaly !== "accepted"),
  )
  const requests = groups.map((group) => group[0]!)
  const results = requests.length === 0 ? [] : params.queryPort.readDependencyInputs(requests)
  const diagnostics: Diagnostic[] = []
  const acceptedXmlAnomalies = acceptedChecks.map(projectStateDependencyBoundary)
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const group = groups[groupIndex]!
    const request = requests[groupIndex]!
    const result = results[groupIndex]
    if (result === undefined || result.requestId !== request.requestId) {
      throw new Error(`Ответ dependency lookup не соответствует запросу ${request.requestId}`)
    }
    if (result.status !== "found") continue
    const index = dependencyFormIndex(result.input.forms)
    const validation = validatePendingChecks({
        ownerCache: createProjectStateOwnerMetadataCache({
          initialInput: result.input,
          projectDir: `${params.projectDir}/${request.componentPath}`,
          componentPath: request.componentPath,
          queryPort: params.queryPort,
        }),
        checks: group.map((check) => check.check.kind === "fillValue"
          ? {
              ...check.check,
              location: { ...check.check.location, filePath: check.projectPath },
            }
          : {
              ...check.check,
              location: { ...check.check.location, filePath: check.projectPath },
              index,
              nameMode: "yaml",
            }),
      })
    diagnostics.push(...validation.diagnostics)
    for (const path of validation.acceptedXmlAnomalyPaths) {
      const accepted = group.find(({ check }) => xmlAnomalyPathEquals(check.yamlPath, path))
      if (accepted !== undefined) acceptedXmlAnomalies.push(projectStateDependencyBoundary(accepted))
    }
  }
  return { diagnostics, acceptedXmlAnomalies: dedupeProjectStateBoundaries(acceptedXmlAnomalies) }
}

function projectStateDependencyBoundary(check: ProjectDependencyInputQuery): ProjectStateXmlAnomalyBoundary {
  return {
    componentPath: check.componentPath,
    projectPath: check.projectPath,
    yamlPath: check.check.yamlPath,
  }
}

function xmlAnomalyPathEquals(
  left: readonly (string | number)[],
  right: readonly (string | number)[],
): boolean {
  return yamlPathToPointer(left) === yamlPathToPointer(right)
}

function dedupeProjectStateBoundaries(
  boundaries: readonly ProjectStateXmlAnomalyBoundary[],
): ProjectStateXmlAnomalyBoundary[] {
  const seen = new Set<string>()
  return boundaries.filter((boundary) => {
    const key = `${boundary.componentPath}\u0000${boundary.projectPath}\u0000${yamlPathToPointer(boundary.yamlPath) ?? ""}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
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
      if (stored === undefined) {
        return ownerMetadataNotFound({
          filePath: ownerMetadataProjectPath(params.componentPath, ref),
          ref,
        })
      }
      return ownerMetadataFromFacts({
        projectDir: params.projectDir,
        componentPath: params.componentPath,
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
        ? ownerMetadataNotFound({
            filePath: ownerMetadataProjectPath(params.componentPath, ref),
            ref,
          })
        : ownerMetadataFromFacts({
            projectDir: params.projectDir,
            componentPath: params.componentPath,
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
