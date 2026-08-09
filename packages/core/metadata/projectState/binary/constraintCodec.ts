import type { MetadataTargetConstraint } from "../../orchestration/metadataTarget/types"

export function encodeMetadataTargetConstraint(value: MetadataTargetConstraint): string {
  return encodeValue(value)
}

export function decodeMetadataTargetConstraint(value: string): MetadataTargetConstraint {
  const cursor = { offset: 0 }
  const decoded = decodeValue(value, cursor)
  if (cursor.offset !== value.length || typeof decoded !== "object" || decoded === null || Array.isArray(decoded)) {
    throw new Error("Повреждено ограничение metadata target")
  }
  return decoded as unknown as MetadataTargetConstraint
}

function encodeValue(value: unknown): string {
  if (typeof value === "string") return `s${value.length}:${value}`
  if (typeof value === "boolean") return value ? "t" : "f"
  if (typeof value === "number") return `d${String(value).length}:${value}`
  if (Array.isArray(value)) return `a${value.length}:${value.map(encodeValue).join("")}`
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    return `o${entries.length}:${entries.map(([key, item]) => encodeValue(key) + encodeValue(item)).join("")}`
  }
  throw new Error("Ограничение metadata target содержит неподдерживаемое значение")
}

function decodeValue(source: string, cursor: { offset: number }): unknown {
  const tag = source[cursor.offset++]
  if (tag === "t") return true
  if (tag === "f") return false
  const length = readLength(source, cursor)
  if (tag === "s" || tag === "d") {
    const value = source.slice(cursor.offset, cursor.offset + length)
    cursor.offset += length
    if (value.length !== length) throw new Error("Повреждено ограничение metadata target")
    return tag === "s" ? value : Number(value)
  }
  if (tag === "a") return Array.from({ length }, () => decodeValue(source, cursor))
  if (tag === "o") {
    const result: Record<string, unknown> = {}
    for (let index = 0; index < length; index += 1) {
      const key = decodeValue(source, cursor)
      if (typeof key !== "string") throw new Error("Повреждено ограничение metadata target")
      result[key] = decodeValue(source, cursor)
    }
    return result
  }
  throw new Error("Повреждено ограничение metadata target")
}

function readLength(source: string, cursor: { offset: number }): number {
  const end = source.indexOf(":", cursor.offset)
  if (end < 0) throw new Error("Повреждено ограничение metadata target")
  const length = Number(source.slice(cursor.offset, end))
  if (!Number.isSafeInteger(length) || length < 0) throw new Error("Повреждено ограничение metadata target")
  cursor.offset = end + 1
  return length
}
