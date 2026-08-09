import type { OwnerTypeRef } from "../../orchestration/dataPath/types"

export function encodeBinaryOwnerKey(owner: OwnerTypeRef): string {
  return `${owner.kind.length}:${owner.kind}${owner.name === undefined ? "-:" : `${owner.name.length}:${owner.name}`}`
}

export function decodeBinaryOwnerKey(value: string): OwnerTypeRef {
  const kindSeparator = value.indexOf(":")
  if (kindSeparator <= 0) throw new Error("Некорректный ключ владельца")
  const kindLength = Number(value.slice(0, kindSeparator))
  const kindStart = kindSeparator + 1
  const kind = value.slice(kindStart, kindStart + kindLength)
  const namePart = value.slice(kindStart + kindLength)
  if (kind.length !== kindLength) throw new Error("Некорректный ключ владельца")
  if (namePart === "-:") return { kind }
  const nameSeparator = namePart.indexOf(":")
  if (nameSeparator <= 0) throw new Error("Некорректный ключ владельца")
  const nameLength = Number(namePart.slice(0, nameSeparator))
  const name = namePart.slice(nameSeparator + 1)
  if (name.length !== nameLength) throw new Error("Некорректный ключ владельца")
  return { kind, name }
}
