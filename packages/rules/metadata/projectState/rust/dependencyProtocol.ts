const MAGIC = 0x5644_4b4e
const MAJOR = 1
const HEADER_BYTES = 20
const ROW_BYTES = 12

const KINDS = [undefined, "pendingReference", "pendingCheck", "structuredDocument"] as const

export interface RustDeferredValidationRow {
  readonly kind: "pendingReference" | "pendingCheck" | "structuredDocument"
  readonly fileId: number
  readonly rowId: number
}

export function decodeRustDeferredValidationPage(
  bytes: Uint8Array,
): readonly RustDeferredValidationRow[] {
  if (bytes.byteLength < HEADER_BYTES) return invalid()
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const count = view.getUint32(8, true)
  const rowsOffset = view.getUint32(12, true)
  const byteLength = view.getUint32(16, true)
  const expectedLength = HEADER_BYTES + count * ROW_BYTES
  if (
    view.getUint32(0, true) !== MAGIC ||
    view.getUint16(4, true) !== MAJOR ||
    view.getUint16(6, true) !== 0 ||
    rowsOffset !== HEADER_BYTES ||
    !Number.isSafeInteger(expectedLength) ||
    byteLength !== expectedLength ||
    bytes.byteLength !== expectedLength
  ) return invalid()

  return Array.from({ length: count }, (_, index) => {
    const offset = rowsOffset + index * ROW_BYTES
    const kind = KINDS[view.getUint16(offset, true)]
    if (kind === undefined || view.getUint16(offset + 2, true) !== 0) return invalid()
    return {
      kind,
      fileId: view.getUint32(offset + 4, true),
      rowId: view.getUint32(offset + 8, true),
    }
  })
}

function invalid(): never {
  throw new Error("Повреждён Rust deferred validation response")
}
