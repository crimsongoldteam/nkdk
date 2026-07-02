import { resolve } from "path"
import { getDataPathOwnerKind } from "./registry"
import type { OwnerMetadataCache, OwnerMetadataResult } from "./ownerCache"
import type { OwnerTypeRef } from "./types"
import {
  decodeObjectFieldIndex,
  decodeSharedValidationOwners,
  type SharedValidationSnapshot,
  type SharedValidationOwnerRecord,
} from "../sharedValidationSnapshot"
import type { Diagnostic } from "../types"

export function createOwnerMetadataCacheFromSharedValidationSnapshot(params: {
  projectDir: string
  snapshot: SharedValidationSnapshot
}): OwnerMetadataCache {
  const payload = decodeSharedValidationOwners(params.snapshot)
  const byOwner = new Map(payload.records.map((record) => [ownerKey(record.ref), record]))
  const results = new Map<string, OwnerMetadataResult>()

  return {
    get(ref) {
      const key = ownerKey(ref)
      const cached = results.get(key)
      if (cached !== undefined) return cached

      const ownerKind = getDataPathOwnerKind(ref.kind)
      const tableRef = ownerKind ? { kind: ownerKind.projectDir, name: ref.name } : ref
      const record = byOwner.get(ownerKey(tableRef))
      const result = record === undefined ? notFound(resolve(params.projectDir), ownerKind?.projectDir ?? ref.kind, ref) : ownerResult(ref, record)
      results.set(key, result)
      return result
    },
  }
}

function ownerResult(ref: OwnerTypeRef, record: SharedValidationOwnerRecord): OwnerMetadataResult {
  if (record.importDiagnostics.length > 0) return { status: "import-error", diagnostics: record.importDiagnostics }

  const ownerKind = getDataPathOwnerKind(ref.kind)
  if (ownerKind === undefined || record.model === undefined || record.fieldIndex === undefined) {
    return {
      status: "import-error",
      diagnostics: [crossFileDiagnostic(record.filePath, `Не удалось импортировать владельца ${formatOwnerRef(ref)}`)],
    }
  }

  const spec = {
    kind: ownerKind.kind,
    dir: ownerKind.projectDir,
    rule: ownerKind.rule,
    exportSchema: () => ({}) as never,
    importModel: () => undefined,
  }

  return {
    status: "ok",
    owner: {
      ref,
      filePath: record.filePath,
      model: record.model as never,
      rule: spec.rule,
      spec,
      fieldIndex: decodeObjectFieldIndex(record.fieldIndex),
    },
  }
}

function notFound(projectDir: string, dir: string, ref: OwnerTypeRef): OwnerMetadataResult {
  return {
    status: "not-found",
    diagnostics: [crossFileDiagnostic(`${projectDir}/${dir}/${ref.name ?? ""}/Свойства.yaml`, `Не найден владелец ${formatOwnerRef(ref)}`)],
  }
}

function ownerKey(ref: OwnerTypeRef): string {
  return `${ref.kind}:${ref.name ?? ""}`
}

function formatOwnerRef(ref: OwnerTypeRef): string {
  return ref.name ? `${ref.kind}.${ref.name}` : ref.kind
}

function crossFileDiagnostic(filePath: string, message: string): Diagnostic {
  return {
    filePath,
    line: 1,
    col: 1,
    severity: "error",
    source: "cross-file",
    message,
  }
}
