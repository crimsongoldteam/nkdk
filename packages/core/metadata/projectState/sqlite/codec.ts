import { deserialize, serialize } from "node:v8"
import type { OwnerTypeRef } from "../../validation/dataPath/types"

export function encodeOwnerKey(owner: OwnerTypeRef): string {
  return `${owner.kind.length}:${owner.kind}${owner.name === undefined ? "-:" : `${owner.name.length}:${owner.name}`}`
}

export function decodeOwnerKey(value: string): OwnerTypeRef {
  const firstSeparator = value.indexOf(":")
  if (firstSeparator <= 0) throw new Error("Некорректный owner_key")
  const kindLength = Number(value.slice(0, firstSeparator))
  const kindStart = firstSeparator + 1
  const kind = value.slice(kindStart, kindStart + kindLength)
  const namePart = value.slice(kindStart + kindLength)
  if (namePart === "-:") return { kind }
  const nameSeparator = namePart.indexOf(":")
  if (nameSeparator <= 0) throw new Error("Некорректный owner_key")
  const nameLength = Number(namePart.slice(0, nameSeparator))
  const name = namePart.slice(nameSeparator + 1)
  if (name.length !== nameLength) throw new Error("Некорректный owner_key")
  return { kind, name }
}

export function encodeValue(value: unknown): Uint8Array {
  return serialize(value)
}

export function decodeValue<T>(value: Uint8Array): T {
  return deserialize(value) as T
}

export function encodeJson(value: unknown): string {
  return JSON.stringify(value)
}

export function decodeJson<T>(value: string): T {
  return JSON.parse(value) as T
}
