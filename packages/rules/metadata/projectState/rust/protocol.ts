const QUERY_MAGIC = 0x5153_4b4e
const ABI_MAJOR = 1
const ABI_MINOR = 0
const ENVELOPE_BYTES = 24
const BASELINE_OPERATION = 1
const BASELINE_REQUEST_BYTES = 8
const BASELINE_RESPONSE_BYTES = 16
const COMPARE_OPERATION = 2
const COMPARE_REQUEST_BYTES = 32
const COMPARE_RESPONSE_BYTES = 8
const TARGET_OPERATION = 3
const TARGET_REQUEST_BYTES = 16
const TARGET_RESULT_BYTES = 28
const MISSING_FILE_ID = 0xffff_ffff
const NONE = 0xffff_ffff

export interface RustFileBaselineResult {
  readonly status: "found" | "missing"
  readonly fileId?: number
  readonly hash?: bigint
}

export interface RustResolvedTargetIds {
  readonly kind: "object" | "member" | "value"
  readonly sourceFileId: number
  readonly canonicalId: number
  readonly componentPathId: number
  readonly itemProjectPathId?: number
  readonly ownerProjectPathId?: number
}

export type RustTargetLookupResult =
  | { readonly status: "found"; readonly target: RustResolvedTargetIds }
  | { readonly status: "missing" | "ambiguous" }

export interface RustFileComparisonRequest {
  readonly projectPath: string
  readonly componentPath: string
  readonly hash: bigint
  readonly resourceKind: "yaml" | "resource"
  readonly yamlRole?: "configuration" | "properties" | "form"
}

export interface RustFileComparisonResult {
  readonly changed: readonly { readonly index: number; readonly fileId?: number }[]
  readonly deletedFileIds: readonly number[]
}

export function encodeRustFileBaselineRequest(
  projectPaths: readonly string[],
): Uint8Array<ArrayBuffer> {
  const encoded = projectPaths.map((path) => new TextEncoder().encode(path))
  const rowsOffset = ENVELOPE_BYTES
  const stringsOffset = rowsOffset + encoded.length * BASELINE_REQUEST_BYTES
  const byteLength = stringsOffset + encoded.reduce((sum, value) => sum + value.byteLength, 0)
  const bytes = new Uint8Array(byteLength)
  const view = new DataView(bytes.buffer)
  writeEnvelope(view, BASELINE_OPERATION, projectPaths.length, rowsOffset, stringsOffset)
  let stringOffset = 0
  encoded.forEach((path, index) => {
    const row = rowsOffset + index * BASELINE_REQUEST_BYTES
    view.setUint32(row, stringOffset, true)
    view.setUint32(row + 4, path.byteLength, true)
    bytes.set(path, stringsOffset + stringOffset)
    stringOffset += path.byteLength
  })
  return bytes
}

export function decodeRustFileBaselineResponse(
  bytes: Uint8Array,
): readonly RustFileBaselineResult[] {
  const envelope = readEnvelope(bytes, BASELINE_OPERATION)
  if (
    envelope.stringsOffset !== envelope.rowsOffset + envelope.requestCount * BASELINE_RESPONSE_BYTES
    || envelope.stringsOffset !== bytes.byteLength
  ) {
    throw new Error("Повреждён ответ Rust file baseline")
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return Array.from({ length: envelope.requestCount }, (_, index) => {
    const row = envelope.rowsOffset + index * BASELINE_RESPONSE_BYTES
    const status = view.getUint32(row, true)
    if (status === 0) return { status: "missing" }
    if (status !== 1) throw new Error(`Неизвестный статус Rust file baseline: ${status}`)
    const fileId = view.getUint32(row + 4, true)
    if (fileId === MISSING_FILE_ID) throw new Error("Найденный файл не содержит fileId")
    return { status: "found", fileId, hash: view.getBigUint64(row + 8, true) }
  })
}

export function encodeRustTargetRequest(
  requests: readonly { readonly componentPath: string; readonly canonicalTarget: string }[],
): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder()
  const encoded = requests.map(({ componentPath, canonicalTarget }) => ({
    componentPath: encoder.encode(componentPath),
    canonicalTarget: encoder.encode(canonicalTarget),
  }))
  const rowsOffset = ENVELOPE_BYTES
  const stringsOffset = rowsOffset + requests.length * TARGET_REQUEST_BYTES
  const stringsLength = encoded.reduce((sum, request) =>
    sum + request.componentPath.byteLength + request.canonicalTarget.byteLength, 0)
  const bytes = new Uint8Array(stringsOffset + stringsLength)
  const view = new DataView(bytes.buffer)
  writeEnvelope(view, TARGET_OPERATION, requests.length, rowsOffset, stringsOffset)
  let stringOffset = 0
  encoded.forEach(({ componentPath, canonicalTarget }, index) => {
    const row = rowsOffset + index * TARGET_REQUEST_BYTES
    view.setUint32(row, stringOffset, true)
    view.setUint32(row + 4, componentPath.byteLength, true)
    bytes.set(componentPath, stringsOffset + stringOffset)
    stringOffset += componentPath.byteLength
    view.setUint32(row + 8, stringOffset, true)
    view.setUint32(row + 12, canonicalTarget.byteLength, true)
    bytes.set(canonicalTarget, stringsOffset + stringOffset)
    stringOffset += canonicalTarget.byteLength
  })
  return bytes
}

export function encodeRustFileComparisonRequest(
  requests: readonly RustFileComparisonRequest[],
): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder()
  const encoded = requests.map((request) => ({
    ...request,
    projectPath: encoder.encode(request.projectPath),
    componentPath: encoder.encode(request.componentPath),
  }))
  const rowsOffset = ENVELOPE_BYTES
  const stringsOffset = rowsOffset + requests.length * COMPARE_REQUEST_BYTES
  const stringsLength = encoded.reduce((sum, request) =>
    sum + request.projectPath.byteLength + request.componentPath.byteLength, 0)
  const bytes = new Uint8Array(stringsOffset + stringsLength)
  const view = new DataView(bytes.buffer)
  writeEnvelope(view, COMPARE_OPERATION, requests.length, rowsOffset, stringsOffset)
  let stringOffset = 0
  encoded.forEach((request, index) => {
    const row = rowsOffset + index * COMPARE_REQUEST_BYTES
    view.setUint32(row, stringOffset, true)
    view.setUint32(row + 4, request.projectPath.byteLength, true)
    bytes.set(request.projectPath, stringsOffset + stringOffset)
    stringOffset += request.projectPath.byteLength
    view.setUint32(row + 8, stringOffset, true)
    view.setUint32(row + 12, request.componentPath.byteLength, true)
    bytes.set(request.componentPath, stringsOffset + stringOffset)
    stringOffset += request.componentPath.byteLength
    view.setBigUint64(row + 16, request.hash, true)
    view.setUint8(row + 24, request.resourceKind === "yaml" ? 1 : 2)
    view.setUint8(row + 25, request.yamlRole === undefined
      ? 0
      : ({ configuration: 1, properties: 2, form: 3 } as const)[request.yamlRole])
  })
  return bytes
}

export function decodeRustFileComparisonResponse(bytes: Uint8Array): RustFileComparisonResult {
  const envelope = readEnvelope(bytes, COMPARE_OPERATION)
  const deletedOffset = envelope.rowsOffset + envelope.requestCount * COMPARE_RESPONSE_BYTES
  if (
    envelope.stringsOffset < deletedOffset
    || (envelope.stringsOffset - deletedOffset) % 4 !== 0
    || envelope.stringsOffset !== bytes.byteLength
  ) {
    throw new Error("Повреждён ответ Rust compare files")
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const changed = Array.from({ length: envelope.requestCount }, (_, index) => {
    const row = envelope.rowsOffset + index * COMPARE_RESPONSE_BYTES
    const status = view.getUint32(row, true)
    if (status === 0) return undefined
    if (status !== 1) throw new Error(`Неизвестный статус Rust compare files: ${status}`)
    const fileId = view.getUint32(row + 4, true)
    return { index, ...(fileId === NONE ? {} : { fileId }) }
  }).filter((value): value is { readonly index: number; readonly fileId?: number } => value !== undefined)
  const deletedCount = (envelope.stringsOffset - deletedOffset) / 4
  return {
    changed,
    deletedFileIds: Array.from({ length: deletedCount }, (_, index) =>
      view.getUint32(deletedOffset + index * 4, true)),
  }
}

export function decodeRustTargetResponse(bytes: Uint8Array): readonly RustTargetLookupResult[] {
  const envelope = readEnvelope(bytes, TARGET_OPERATION)
  if (
    envelope.stringsOffset !== envelope.rowsOffset + envelope.requestCount * TARGET_RESULT_BYTES
    || envelope.stringsOffset !== bytes.byteLength
  ) {
    throw new Error("Повреждены записи ответа Rust target lookup")
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  return Array.from({ length: envelope.requestCount }, (_, index) => {
    const row = envelope.rowsOffset + index * TARGET_RESULT_BYTES
    const status = view.getUint32(row, true)
    if (status === 0) return { status: "missing" }
    if (status === 2) return { status: "ambiguous" }
    if (status !== 1) throw new Error(`Неизвестный статус Rust target lookup: ${status}`)
    const kind = (["object", "member", "value"] as const)[view.getUint32(row + 4, true) - 1]
    if (kind === undefined) throw new Error("Неизвестный вид Rust target")
    return {
      status: "found",
      target: {
        kind,
        sourceFileId: view.getUint32(row + 8, true),
        canonicalId: view.getUint32(row + 12, true),
        componentPathId: view.getUint32(row + 16, true),
        ...optionalId("itemProjectPathId", view.getUint32(row + 20, true)),
        ...optionalId("ownerProjectPathId", view.getUint32(row + 24, true)),
      },
    }
  })

  function optionalId<Key extends "itemProjectPathId" | "ownerProjectPathId">(
    key: Key,
    value: number,
  ): Partial<Record<Key, number>> {
    return value === NONE ? {} : { [key]: value } as Record<Key, number>
  }
}

function writeEnvelope(
  view: DataView,
  operation: number,
  requestCount: number,
  rowsOffset: number,
  stringsOffset: number,
): void {
  view.setUint32(0, QUERY_MAGIC, true)
  view.setUint16(4, ABI_MAJOR, true)
  view.setUint16(6, ABI_MINOR, true)
  view.setUint16(8, operation, true)
  view.setUint16(10, 0, true)
  view.setUint32(12, requestCount, true)
  view.setUint32(16, rowsOffset, true)
  view.setUint32(20, stringsOffset, true)
}

function readEnvelope(bytes: Uint8Array, expectedOperation: number) {
  if (bytes.byteLength < ENVELOPE_BYTES) throw new Error("Ответ Rust ProjectState оборван")
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (
    view.getUint32(0, true) !== QUERY_MAGIC
    || view.getUint16(4, true) !== ABI_MAJOR
    || view.getUint16(6, true) !== ABI_MINOR
    || view.getUint16(8, true) !== expectedOperation
  ) {
    throw new Error("Несовместимый ответ Rust ProjectState")
  }
  return {
    requestCount: view.getUint32(12, true),
    rowsOffset: view.getUint32(16, true),
    stringsOffset: view.getUint32(20, true),
  }
}
