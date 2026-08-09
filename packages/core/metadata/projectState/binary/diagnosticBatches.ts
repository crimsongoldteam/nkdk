import {
  createDiagnosticBatchWriter,
  type DiagnosticBatchView,
  type EncodedDiagnosticBatch,
} from "../../diagnostics/binaryBatch"
import type { DiagnosticSource, DiagnosticSeverity } from "../../diagnostics/types"
import type {
  ProjectStateDependencyValidator,
  ProjectStatePendingOwnerCheck,
  ProjectStatePendingReferenceCheck,
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
  const queryPort = createBinaryProjectStateQueryPort(snapshot, { typedReader: typed, dependencyValidator })
  const readiness = dependencyValidator.readReadiness({ queryPort })
  const { references, dependencies, owners } = collectDependencyChecks(
    snapshot,
    typed,
    readiness.blockedComponentPaths,
  )
  const writer = createDiagnosticBatchWriter()
  append(writer, dependencyValidator.validateReferences({ checks: references, projectDir, queryPort }))
  append(writer, dependencyValidator.validateOwners({ checks: owners, projectDir, queryPort }))
  append(writer, dependencyValidator.validateDependencies({ checks: dependencies, projectDir, queryPort }))
  append(writer, readiness.diagnostics)
  return writer.finish()
}

function collectDependencyChecks(
  snapshot: ProjectStateSnapshotView,
  typed: TypedProjectStateReader,
  blockedComponentPaths: ReadonlySet<string>,
) {
  const references: ProjectStatePendingReferenceCheck[] = []
  const dependencies: ProjectDependencyInputQuery[] = []
  const owners: ProjectStatePendingOwnerCheck[] = []
  const seenOwners = new Set<string>()
  for (const fileId of yamlFileIds(snapshot)) {
    const componentPath = snapshot.componentPath(fileId)
    const projectPath = snapshot.filePath(fileId)
    if (blockedComponentPaths.has(componentPath)) continue
    typed.pendingReferences(fileId).forEach((reference, index) => references.push({
      requestId: `reference:${fileId}:${index}`,
      componentPath,
      reference: { ...reference, filePath: projectPath },
    }))
    for (const [index, check] of typed.pendingChecks(fileId).entries()) {
      dependencies.push({
        requestId: `dependency:${fileId}:${index}`,
        componentPath,
        projectPath,
        check,
      })
      const ownerKey = `${componentPath}\u0000${check.owner.kind}\u0000${check.owner.name ?? ""}`
      if (seenOwners.has(ownerKey)) continue
      seenOwners.add(ownerKey)
      owners.push({ requestId: `owner:${fileId}:${index}`, componentPath, owner: check.owner })
    }
  }
  return { references, dependencies, owners }
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
