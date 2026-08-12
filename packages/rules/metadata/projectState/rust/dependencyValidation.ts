import type { NativeProjectStateReader } from "@nkdk/project-state-native"
import {
  encodeDiagnosticBatch,
  type Diagnostic,
  type EncodedDiagnosticBatch,
} from "@nkdk/runtime"
import type {
  ProjectDependencyInputQuery,
  ProjectStateAddressableRequiredCheck,
  ProjectStateDependencyValidator,
  ProjectStatePendingOwnerCheck,
  ProjectStatePendingReferenceCheck,
} from "../contracts/dependencyValidation"
import type { ProjectStateSnapshotView } from "../binary/snapshot"
import { createTypedProjectStateReader } from "../binary/typedReader"
import {
  decodeRustDeferredValidationPage,
  type RustDeferredValidationRow,
} from "./dependencyProtocol"
import { createRustProjectStateQueryPort } from "./readSession"

const DEFAULT_PAGE_SIZE = 2_000

export interface RustDependencyValidationPageEvent {
  readonly deferredRows: number
  readonly nativeDiagnostics: number
  readonly nativeTemporaryBytes: number
}

export function validateRustDependencyDiagnosticBatches(params: {
  readonly native: Pick<NativeProjectStateReader, "execute" | "planDependencyValidation">
  readonly snapshot: ProjectStateSnapshotView
  readonly projectDir: string
  readonly dependencyValidator: ProjectStateDependencyValidator
  readonly pageSize?: number
  readonly onPage?: (event: RustDependencyValidationPageEvent) => void
}): readonly EncodedDiagnosticBatch[] {
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
  if (!Number.isSafeInteger(pageSize) || pageSize <= 0) {
    throw new RangeError("pageSize должен быть положительным целым")
  }
  const typed = createTypedProjectStateReader(params.snapshot)
  const queryPort = createRustProjectStateQueryPort({
    native: params.native,
    snapshot: params.snapshot,
    typedReader: typed,
    dependencyValidator: params.dependencyValidator,
  })
  const categories = {
    references: [] as EncodedDiagnosticBatch[],
    owners: [] as EncodedDiagnosticBatch[],
    dependencies: [] as EncodedDiagnosticBatch[],
    addressableRequired: [] as EncodedDiagnosticBatch[],
  }
  const structuredRows: RustDeferredValidationRow[] = []
  const readiness: EncodedDiagnosticBatch[] = []
  const seenOwners = new Set<string>()
  const plan = params.native.planDependencyValidation({
    // Диагностики готовности по существующему договору содержат проектные пути.
    projectDir: "",
    batchSize: pageSize,
  })
  try {
    for (;;) {
      const page = plan.nextPage()
      const rows = decodeRustDeferredValidationPage(page.deferred)
      params.onPage?.({
        deferredRows: rows.length,
        nativeDiagnostics: page.stats.nativeDiagnostics,
        nativeTemporaryBytes: page.stats.nativeTemporaryBytes,
      })
      if (diagnosticCount(page.diagnostics) > 0) readiness.push({ bytes: page.diagnostics })
      const checks = decodePage(params.snapshot, typed, rows, seenOwners, structuredRows)
      appendDiagnostics(categories.references, params.dependencyValidator.validateReferences({
        checks: checks.references,
        projectDir: params.projectDir,
        queryPort,
      }))
      appendDiagnostics(categories.owners, params.dependencyValidator.validateOwners({
        checks: checks.owners,
        projectDir: params.projectDir,
        queryPort,
      }))
      appendDiagnostics(categories.dependencies, params.dependencyValidator.validateDependencies({
        checks: checks.dependencies,
        projectDir: params.projectDir,
        queryPort,
      }))
      appendDiagnostics(categories.addressableRequired, params.dependencyValidator.validateAddressableRequired({
        checks: checks.addressableRequired,
        projectDir: params.projectDir,
        queryPort,
      }))
      if (page.nextCursor === undefined) break
    }
  } finally {
    plan.close()
  }
  const structuredDocuments = structuredRows.map((row) => {
    const stored = typed.structuredDocumentRow(row.rowId)
    assertSourceFile(row, stored.fileId)
    return {
      componentPath: params.snapshot.componentPath(stored.fileId),
      projectPath: params.snapshot.filePath(stored.fileId),
      entry: stored.value,
    }
  })
  const structured = params.dependencyValidator.validateStructuredDocuments({
    facts: structuredDocuments,
    projectDir: params.projectDir,
    queryPort,
  })
  const structuredBatches: EncodedDiagnosticBatch[] = []
  appendDiagnostics(structuredBatches, structured)
  return [
    ...categories.references,
    ...categories.owners,
    ...categories.dependencies,
    ...categories.addressableRequired,
    ...structuredBatches,
    ...readiness,
  ]
}

function decodePage(
  snapshot: ProjectStateSnapshotView,
  typed: ReturnType<typeof createTypedProjectStateReader>,
  rows: readonly RustDeferredValidationRow[],
  seenOwners: Set<string>,
  structuredRows: RustDeferredValidationRow[],
) {
  const references: ProjectStatePendingReferenceCheck[] = []
  const dependencies: ProjectDependencyInputQuery[] = []
  const addressableRequired: ProjectStateAddressableRequiredCheck[] = []
  const owners: ProjectStatePendingOwnerCheck[] = []
  for (const row of rows) {
    if (row.kind === "structuredDocument") {
      structuredRows.push(row)
      continue
    }
    if (row.kind === "pendingReference") {
      const stored = typed.pendingReferenceRow(row.rowId)
      assertSourceFile(row, stored.fileId)
      references.push({
        requestId: `reference:${stored.fileId}:${row.rowId}`,
        componentPath: snapshot.componentPath(stored.fileId),
        reference: { ...stored.value, filePath: snapshot.filePath(stored.fileId) },
      })
      continue
    }
    const stored = typed.pendingCheckRow(row.rowId)
    assertSourceFile(row, stored.fileId)
    const componentPath = snapshot.componentPath(stored.fileId)
    const projectPath = snapshot.filePath(stored.fileId)
    const requestId = `dependency:${stored.fileId}:${row.rowId}`
    if (stored.value.kind === "addressableRequired") {
      addressableRequired.push({ requestId, componentPath, projectPath, check: stored.value })
      continue
    }
    dependencies.push({ requestId, componentPath, projectPath, check: stored.value })
    if (stored.value.kind !== "dataPath") continue
    const ownerKey = `${componentPath}\u0000${stored.value.owner.kind}\u0000${stored.value.owner.name ?? ""}`
    if (seenOwners.has(ownerKey)) continue
    seenOwners.add(ownerKey)
    owners.push({ requestId: `owner:${stored.fileId}:${row.rowId}`, componentPath, owner: stored.value.owner })
  }
  return { references, dependencies, addressableRequired, owners }
}

function assertSourceFile(row: RustDeferredValidationRow, actual: number): void {
  if (row.fileId !== actual) {
    throw new Error("Rust deferred validation ссылается на чужую строку файла")
  }
}

function appendDiagnostics(target: EncodedDiagnosticBatch[], diagnostics: readonly Diagnostic[]): void {
  if (diagnostics.length > 0) target.push(encodeDiagnosticBatch(diagnostics))
}

function diagnosticCount(bytes: Uint8Array): number {
  if (bytes.byteLength < 12) throw new Error("Rust diagnostic batch оборван")
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(8, true)
}
