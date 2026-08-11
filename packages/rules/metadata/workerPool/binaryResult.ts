import { move, transferableSymbol, valueSymbol } from "piscina"

export interface MetadataWorkerBinaryBuffer {
  readonly name: string
  readonly buffer: ArrayBuffer
}

export interface MetadataWorkerBinaryResult {
  readonly kind: "binaryResult"
  readonly payloadKind: string
  readonly counters: Readonly<Record<string, number>>
  readonly buffers: readonly MetadataWorkerBinaryBuffer[]
}

export function assertMetadataWorkerBinaryResult(
  value: unknown,
): asserts value is MetadataWorkerBinaryResult {
  if (!isRecord(value)) throw new Error("Двоичный результат worker должен быть объектом")
  assertExactKeys(value, ["kind", "payloadKind", "counters", "buffers"], "двоичного результата worker")
  if (value.kind !== "binaryResult") throw new Error("Неизвестный вид двоичного результата worker")
  if (typeof value.payloadKind !== "string" || value.payloadKind.length === 0) {
    throw new Error("Не указан вид содержимого двоичного результата worker")
  }
  if (!isRecord(value.counters)) throw new Error("Счётчики двоичного результата worker повреждены")
  for (const [name, counter] of Object.entries(value.counters)) {
    if (name.length === 0 || typeof counter !== "number" || !Number.isFinite(counter) || counter < 0) {
      throw new Error("Счётчики двоичного результата worker должны быть неотрицательными числами")
    }
  }
  if (!Array.isArray(value.buffers)) throw new Error("Буферы двоичного результата worker должны быть списком")
  const names = new Set<string>()
  const buffers = new Set<ArrayBuffer>()
  for (const entry of value.buffers) {
    if (!isRecord(entry)) throw new Error("Описание буфера worker повреждено")
    assertExactKeys(entry, ["name", "buffer"], "описания буфера worker")
    if (typeof entry.name !== "string" || entry.name.length === 0) throw new Error("Буфер worker должен иметь имя")
    if (names.has(entry.name)) throw new Error(`Буфер worker ${entry.name} указан повторно`)
    if (!(entry.buffer instanceof ArrayBuffer)) throw new Error(`Буфер worker ${entry.name} не владеет ArrayBuffer`)
    if (buffers.has(entry.buffer)) throw new Error("Один ArrayBuffer нельзя передать под несколькими именами")
    names.add(entry.name)
    buffers.add(entry.buffer)
  }
}

export function createMovableBinaryResult(
  result: MetadataWorkerBinaryResult,
): MetadataWorkerBinaryResult {
  assertMetadataWorkerBinaryResult(result)
  const transferables = result.buffers.map(({ buffer }) => buffer)
  return move({
    get [transferableSymbol]() { return transferables },
    get [valueSymbol]() { return result },
  }) as unknown as MetadataWorkerBinaryResult
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function assertExactKeys(
  value: Readonly<Record<string, unknown>>,
  expected: readonly string[],
  subject: string,
): void {
  const allowed = new Set(expected)
  if (Object.keys(value).some((key) => !allowed.has(key)) || expected.some((key) => !(key in value))) {
    throw new Error(`Повреждена структура ${subject}`)
  }
}
