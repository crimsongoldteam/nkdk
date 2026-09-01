import {
  createDiagnosticBatchWriter,
  type DiagnosticBatchView,
  type EncodedDiagnosticBatch,
} from "@nkdk/runtime"
import type { Diagnostic, DiagnosticSource, DiagnosticSeverity } from "@nkdk/runtime"
import { yamlPathToPointer } from "@nkdk/runtime"
import { join, resolve } from "node:path"
import type {
  ProjectStateDependencyValidator,
  ProjectStateAddressableRequiredCheck,
  ProjectStateReferenceCoverageCheck,
  ProjectStatePendingOwnerCheck,
  ProjectStatePendingReferenceCheck,
  ProjectStateSemanticValidationResult,
  ProjectStateXmlAnomalyBoundary,
} from "../contracts/dependencyValidation"
import type { ProjectDependencyInputQuery } from "../contracts/dependencyValidation"
import { PROJECT_STATE_FACT_RECORD_VIEWS } from "./factTables"
import {
  ProjectStateDiagnosticRecordView,
  ProjectStateDiagnosticSectionHeaderView,
} from "./layouts"
import { createBinaryProjectStateQueryPort } from "./readSession"
import type { ProjectStateSnapshotView } from "./snapshot"
import { createTypedProjectStateReader, type TypedProjectStateReader } from "./typedReader"

const SEVERITIES = [undefined, "error", "warning"] as const
const SOURCES = [undefined, "syntax", "structure", "external-file", "cross-file", "reference"] as const

export function readLocalDiagnosticBatch(
  snapshot: ProjectStateSnapshotView,
  publishedMode: boolean,
  dependencyValidator: ProjectStateDependencyValidator,
): DiagnosticBatchView {
  const typed = createTypedProjectStateReader(snapshot)
  const blocked = publishedMode
    ? dependencyValidator.readReadiness({
        queryPort: createBinaryProjectStateQueryPort(snapshot, { typedReader: typed, dependencyValidator }),
      }).blockedComponentPaths
    : new Set<string>()
  const statusRange = snapshot.factTableCatalog().get("validationStatus")
  const statusView = new DataView(snapshot.buffers.facts)
  const diagnosticIds: number[] = []
  if (statusRange !== undefined) {
    for (let statusId = 0; statusId < statusRange.records; statusId += 1) {
      const status = PROJECT_STATE_FACT_RECORD_VIEWS.validationStatus.decode(
        statusView,
        statusRange.byteOffset + statusId * PROJECT_STATE_FACT_RECORD_VIEWS.validationStatus.viewLength,
      )
      const schemaOnly = publishedMode && blocked.has(snapshot.componentPath(status.sourceFileId))
      const start = schemaOnly ? status.schemaDiagnosticsStart : status.diagnosticsStart
      const count = schemaOnly ? status.schemaDiagnosticsCount : status.diagnosticsCount
      for (let offset = 0; offset < count; offset += 1) diagnosticIds.push(start + offset)
    }
  }
  const ids = Uint32Array.from(diagnosticIds)
  const diagnosticsView = new DataView(snapshot.buffers.diagnostics)
  const header = ProjectStateDiagnosticSectionHeaderView.decode(diagnosticsView)
  return {
    count: ids.length,
    diagnostic(index) {
      if (!Number.isSafeInteger(index) || index < 0 || index >= ids.length) {
        throw new RangeError(`Неизвестная диагностика: ${index}`)
      }
      const record = ProjectStateDiagnosticRecordView.decode(
        diagnosticsView,
        header.recordsOffset + ids[index]! * ProjectStateDiagnosticRecordView.viewLength,
      )
      const path = record.pathId === 0xffff_ffff ? undefined : snapshot.stringValue(record.pathId)
      return {
        filePath: snapshot.filePath(record.sourceFileId),
        line: record.line,
        col: record.col,
        message: snapshot.stringValue(record.messageId),
        severity: SEVERITIES[record.severity] as DiagnosticSeverity,
        source: SOURCES[record.source] as DiagnosticSource,
        ...(path === undefined ? {} : { path }),
      }
    },
  }
}

export function validateDependencyDiagnosticBatch(
  snapshot: ProjectStateSnapshotView,
  projectDir: string,
  dependencyValidator: ProjectStateDependencyValidator,
  typed: TypedProjectStateReader = createTypedProjectStateReader(snapshot),
): EncodedDiagnosticBatch {
  const writer = createDiagnosticBatchWriter()
  append(writer, validateSnapshotDependencyDiagnostics(snapshot, projectDir, dependencyValidator, typed))
  return writer.finish()
}

export function validateSnapshotDependencyDiagnostics(
  snapshot: ProjectStateSnapshotView,
  projectDir: string,
  dependencyValidator: ProjectStateDependencyValidator,
  typed: TypedProjectStateReader = createTypedProjectStateReader(snapshot),
): Diagnostic[] {
  const queryPort = createBinaryProjectStateQueryPort(snapshot, { typedReader: typed, dependencyValidator })
  const readiness = dependencyValidator.readReadiness({ queryPort })
  const { references, dependencies, addressableRequired, referenceCoverage, owners, structuredDocuments } = collectDependencyChecks(
    snapshot,
    typed,
    readiness.blockedComponentPaths,
  )
  const pending = collectPendingBoundaries(references, dependencies)
  const accepted = collectAcceptedBoundaryKeys(references, dependencies)
  const referenceResult = validatePendingInWaves({
    checks: references.filter((check) => check.reference.xmlAnomaly !== "accepted"),
    boundary: referenceBoundary,
    accepted,
    validate: (checks) => dependencyValidator.validateReferences({ checks, projectDir, queryPort }),
  })
  addAccepted(accepted, referenceResult.acceptedXmlAnomalies)
  const dependencyResult = validatePendingInWaves({
    checks: dependencies.filter((check) => check.check.xmlAnomaly !== "accepted"),
    boundary: dependencyBoundary,
    accepted,
    validate: (checks) => dependencyValidator.validateDependencies({ checks, projectDir, queryPort }),
  })
  addAccepted(accepted, dependencyResult.acceptedXmlAnomalies)
  const structuredDiagnostics = dependencyValidator.validateStructuredDocuments({
    facts: structuredDocuments,
    projectDir,
    queryPort,
  })
  const specializedErrorBoundaries = new Set(structuredDiagnostics
    .filter(({ severity, path }) => severity === "error" && path !== undefined)
    .map(({ filePath, path }) => diagnosticBoundaryKey(projectDir, filePath, path!)))
  const dependencyDiagnostics = dependencyResult.diagnostics.filter(({ severity, filePath, path }) =>
    severity !== "error"
    || path === undefined
    || !specializedErrorBoundaries.has(diagnosticBoundaryKey(projectDir, filePath, path))
  )

  return [
    ...referenceResult.diagnostics,
    ...dependencyValidator.validateOwners({ checks: owners, projectDir, queryPort }),
    ...dependencyDiagnostics,
    ...dependencyValidator.validateAddressableRequired({ checks: addressableRequired, projectDir, queryPort }),
    ...dependencyValidator.validateReferenceCoverage({ checks: referenceCoverage, projectDir, queryPort }),
    ...structuredDiagnostics,
    ...readiness.diagnostics,
    ...unnecessaryXmlAnomalyDiagnostics(pending, accepted, projectDir),
  ]
}

function diagnosticBoundaryKey(projectDir: string, filePath: string, path: string): string {
  return `${resolve(projectDir, filePath).toLowerCase()}\u0000${path}`
}

function validatePendingInWaves<T>(params: {
  readonly checks: readonly T[]
  readonly boundary: (check: T) => ProjectStateXmlAnomalyBoundary | undefined
  readonly accepted: Set<string>
  readonly validate: (checks: readonly T[]) => ProjectStateSemanticValidationResult
}): ProjectStateSemanticValidationResult {
  const ordinary: T[] = []
  const pending = new Map<string, T[]>()
  for (const check of params.checks) {
    const boundary = params.boundary(check)
    if (boundary === undefined) {
      ordinary.push(check)
      continue
    }
    const key = boundaryKey(boundary)
    if (params.accepted.has(key)) continue
    const queue = pending.get(key)
    if (queue === undefined) pending.set(key, [check])
    else queue.push(check)
  }

  const diagnostics: Diagnostic[] = []
  const acceptedXmlAnomalies: ProjectStateXmlAnomalyBoundary[] = []
  let first = true
  while (first || pending.size > 0) {
    const wave = first ? [...ordinary] : []
    first = false
    for (const [key, queue] of pending) {
      if (params.accepted.has(key)) {
        pending.delete(key)
        continue
      }
      const check = queue.shift()
      if (check !== undefined) wave.push(check)
      if (queue.length === 0) pending.delete(key)
    }
    if (wave.length === 0) break
    const result = params.validate(wave)
    diagnostics.push(...result.diagnostics)
    acceptedXmlAnomalies.push(...result.acceptedXmlAnomalies)
    addAccepted(params.accepted, result.acceptedXmlAnomalies)
  }
  return { diagnostics, acceptedXmlAnomalies }
}

function collectPendingBoundaries(
  references: readonly ProjectStatePendingReferenceCheck[],
  dependencies: readonly ProjectDependencyInputQuery[],
): Map<string, ProjectStateXmlAnomalyBoundary & { readonly line: number; readonly col: number }> {
  const result = new Map<string, ProjectStateXmlAnomalyBoundary & { readonly line: number; readonly col: number }>()
  for (const check of references) {
    const boundary = referenceBoundary(check)
    if (boundary !== undefined) result.set(boundaryKey(boundary), { ...boundary, line: 1, col: 1 })
  }
  for (const check of dependencies) {
    const boundary = dependencyBoundary(check)
    if (boundary !== undefined) result.set(boundaryKey(boundary), {
      ...boundary,
      line: check.check.location.line,
      col: check.check.location.col,
    })
  }
  return result
}

function collectAcceptedBoundaryKeys(
  references: readonly ProjectStatePendingReferenceCheck[],
  dependencies: readonly ProjectDependencyInputQuery[],
): Set<string> {
  const result = new Set<string>()
  for (const check of references) {
    if (check.reference.xmlAnomaly === "accepted") result.add(boundaryKey(referenceBoundaryValue(check)))
  }
  for (const check of dependencies) {
    if (check.check.xmlAnomaly === "accepted") result.add(boundaryKey(dependencyBoundaryValue(check)))
  }
  return result
}

function referenceBoundary(check: ProjectStatePendingReferenceCheck): ProjectStateXmlAnomalyBoundary | undefined {
  return check.reference.xmlAnomaly === "pending" ? referenceBoundaryValue(check) : undefined
}

function referenceBoundaryValue(check: ProjectStatePendingReferenceCheck): ProjectStateXmlAnomalyBoundary {
  return {
    componentPath: check.componentPath,
    projectPath: check.reference.filePath,
    yamlPath: check.reference.yamlPath,
  }
}

function dependencyBoundary(check: ProjectDependencyInputQuery): ProjectStateXmlAnomalyBoundary | undefined {
  return check.check.xmlAnomaly === "pending" ? dependencyBoundaryValue(check) : undefined
}

function dependencyBoundaryValue(check: ProjectDependencyInputQuery): ProjectStateXmlAnomalyBoundary {
  return {
    componentPath: check.componentPath,
    projectPath: check.projectPath,
    yamlPath: check.check.yamlPath,
  }
}

function addAccepted(target: Set<string>, boundaries: readonly ProjectStateXmlAnomalyBoundary[]): void {
  for (const boundary of boundaries) target.add(boundaryKey(boundary))
}

function boundaryKey(boundary: ProjectStateXmlAnomalyBoundary): string {
  return `${boundary.componentPath}\u0000${boundary.projectPath}\u0000${yamlPathToPointer(boundary.yamlPath) ?? ""}`
}

function unnecessaryXmlAnomalyDiagnostics(
  pending: ReadonlyMap<string, ProjectStateXmlAnomalyBoundary & { readonly line: number; readonly col: number }>,
  accepted: ReadonlySet<string>,
  projectDir: string,
): Diagnostic[] {
  return [...pending].flatMap(([key, boundary]) => accepted.has(key) ? [] : [{
    filePath: join(projectDir, boundary.projectPath),
    line: boundary.line,
    col: boundary.col,
    path: yamlPathToPointer(boundary.yamlPath),
    severity: "error" as const,
    source: "structure" as const,
    message: "Тег XML-аномалии лишний: значение не содержит ошибки",
  }])
}

export function collectDependencyChecks(
  snapshot: ProjectStateSnapshotView,
  typed: TypedProjectStateReader,
  blockedComponentPaths: ReadonlySet<string>,
) {
  const references: ProjectStatePendingReferenceCheck[] = []
  const dependencies: ProjectDependencyInputQuery[] = []
  const addressableRequired: ProjectStateAddressableRequiredCheck[] = []
  const referenceCoverage: ProjectStateReferenceCoverageCheck[] = []
  const owners: ProjectStatePendingOwnerCheck[] = []
  const structuredDocuments = []
  const seenOwners = new Set<string>()
  for (const fileId of yamlFileIds(snapshot)) {
    const componentPath = snapshot.componentPath(fileId)
    const projectPath = snapshot.filePath(fileId)
    if (blockedComponentPaths.has(componentPath)) continue
    for (const entry of typed.structuredDocuments(fileId)) {
      structuredDocuments.push({ componentPath, projectPath, entry })
    }
    typed.pendingReferences(fileId).forEach((reference, index) => references.push({
      requestId: `reference:${fileId}:${index}`,
      componentPath,
      reference: { ...reference, filePath: projectPath },
    }))
    for (const [index, check] of typed.pendingChecks(fileId).entries()) {
      if (check.kind === "addressableRequired") {
        addressableRequired.push({
          requestId: `required:${fileId}:${index}`,
          componentPath,
          projectPath,
          check,
        })
        continue
      }
      if (check.kind === "referenceCoverage") {
        referenceCoverage.push({
          requestId: `coverage:${fileId}:${index}`,
          componentPath,
          projectPath,
          check,
        })
        continue
      }
      dependencies.push({
        requestId: `dependency:${fileId}:${index}`,
        componentPath,
        projectPath,
        check,
      })
      if (check.kind !== "dataPath") continue
      const ownerKey = `${componentPath}\u0000${check.owner.kind}\u0000${check.owner.name ?? ""}`
      if (seenOwners.has(ownerKey)) continue
      seenOwners.add(ownerKey)
      owners.push({ requestId: `owner:${fileId}:${index}`, componentPath, owner: check.owner })
    }
  }
  return { references, dependencies, addressableRequired, referenceCoverage, owners, structuredDocuments }
}

function* yamlFileIds(snapshot: ProjectStateSnapshotView): IterableIterator<number> {
  for (let fileId = 0; fileId < snapshot.fileCount; fileId += 1) {
    if (snapshot.fileRecord(fileId).updateKind === 1) yield fileId
  }
}

function append(
  writer: ReturnType<typeof createDiagnosticBatchWriter>,
  diagnostics: Iterable<Parameters<typeof writer.append>[0]>,
): void {
  for (const diagnostic of diagnostics) writer.append(diagnostic)
}
