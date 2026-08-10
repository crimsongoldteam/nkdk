import type {
  MetadataOperationBlockedReference,
  MetadataOperationDiagnostic,
  MetadataOperationReferenceChange,
  MetadataOperationResult,
} from "@nkdk/rules"
import type { ToolPayload } from "../contracts/common"
import type { DiagnosticReportOperation } from "./diagnosticReport"
import { prepareDiagnosticOutput } from "./diagnosticReport"

export async function prepareMetadataOperationOutput(params: {
  readonly projectDir: string
  readonly operation: Extract<DiagnosticReportOperation, "rename" | "find-references">
  readonly result: MetadataOperationResult
}): Promise<ToolPayload> {
  const output = await prepareDiagnosticOutput({
    projectDir: params.projectDir,
    operation: params.operation,
    operationId: `${Date.now()}-${Math.random()}`,
    diagnostics: operationRecords(params.result),
    map: (record) => record,
  })
  const diagnostics = output.diagnostics
    .filter((record): record is OperationDiagnosticRecord => record.recordKind === "diagnostic")
    .map(({ recordKind: _recordKind, ...diagnostic }) => diagnostic)
  const blockedReferences = output.diagnostics
    .filter((record): record is BlockedReferenceRecord => record.recordKind === "blocked-reference")
    .map(({ recordKind: _recordKind, severity: _severity, ...reference }) => reference)
  const rewrittenReferences = output.diagnostics
    .filter((record): record is RewrittenReferenceRecord => record.recordKind === "rewritten-reference")
    .map(({ recordKind: _recordKind, severity: _severity, ...reference }) => reference)
  const sourceDiagnostics = params.result.diagnostics ?? []
  const resultWithReferences = params.result as MetadataOperationResult & {
    readonly blockedReferences?: readonly MetadataOperationBlockedReference[]
    readonly rewrittenReferences?: readonly MetadataOperationReferenceChange[]
  }
  const {
    diagnostics: _diagnostics,
    blockedReferences: _blocked,
    rewrittenReferences: _rewritten,
    ...operationResult
  } = resultWithReferences
  const errors = sourceDiagnostics.filter((diagnostic) => diagnostic.severity === "error").length
  const warnings = sourceDiagnostics.length - errors
  const summary = {
    errors,
    warnings,
    shown: diagnostics.length,
    omitted: sourceDiagnostics.length - diagnostics.length,
  }
  return {
    ...operationResult,
    diagnostics,
    blockedReferences,
    rewrittenReferences,
    summary,
    truncated: output.truncated,
    ...(output.report === undefined ? {} : { report: output.report }),
  } as unknown as ToolPayload
}

type OperationOutputRecord = OperationDiagnosticRecord | BlockedReferenceRecord | RewrittenReferenceRecord

type OperationDiagnosticRecord = MetadataOperationDiagnostic & { readonly recordKind: "diagnostic" }
type BlockedReferenceRecord = MetadataOperationBlockedReference & {
  readonly recordKind: "blocked-reference"
  readonly severity: "warning"
}
type RewrittenReferenceRecord = MetadataOperationReferenceChange & {
  readonly recordKind: "rewritten-reference"
  readonly severity: "warning"
}

function* operationRecords(result: MetadataOperationResult): Iterable<OperationOutputRecord> {
  for (const diagnostic of result.diagnostics ?? []) {
    yield { recordKind: "diagnostic", ...diagnostic }
  }
  if ("blockedReferences" in result) {
    for (const reference of result.blockedReferences) {
      yield referenceRecord("blocked-reference", reference)
    }
  }
  if ("rewrittenReferences" in result) {
    for (const reference of result.rewrittenReferences) {
      yield referenceRecord("rewritten-reference", reference)
    }
  }
}

function referenceRecord<
  Kind extends "blocked-reference" | "rewritten-reference",
  Reference extends MetadataOperationBlockedReference | MetadataOperationReferenceChange,
>(recordKind: Kind, reference: Reference): Reference & { readonly recordKind: Kind; readonly severity: "warning" } {
  const record = { recordKind, ...reference } as Reference & { readonly recordKind: Kind; readonly severity: "warning" }
  Object.defineProperty(record, "severity", { value: "warning", enumerable: false })
  return record
}
