import type {
  MetadataOperationDiagnostic,
  MetadataOperationFailure,
  MetadataOperationValidationFailed,
} from "./types"

export function hasMetadataOperationErrors(diagnostics: readonly MetadataOperationDiagnostic[]): boolean {
  return diagnostics.some(({ severity }) => severity === "error")
}

export function metadataOperationValidationFailure(
  message: string,
  diagnostics: MetadataOperationValidationFailed["diagnostics"],
): MetadataOperationValidationFailed {
  return { ok: false, code: "validation_failed", message, diagnostics }
}

export function metadataOperationFailure(
  code: MetadataOperationFailure["code"],
  message: string,
  diagnostics: MetadataOperationDiagnostic[],
): MetadataOperationFailure {
  return {
    ok: false,
    code,
    message,
    changedFiles: [],
    rewrittenReferences: [],
    blockedReferences: [],
    diagnostics,
  }
}
