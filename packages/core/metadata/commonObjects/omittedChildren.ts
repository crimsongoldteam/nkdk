import type { OmittedChildren } from "../configurationIndex/types"

export function mergeOmittedNames(current: readonly string[], saved: OmittedChildren | undefined): string[] {
  assertUniqueNames(current)
  if (saved === undefined) return [...current]
  if (saved.kind !== "names") {
    throw new Error("mergeOmittedNames ожидает omittedChildren.kind = names")
  }
  assertUniqueNames(saved.names)

  const currentNames = new Set(current)
  const preserved = saved.names.filter((name) => currentNames.has(name))
  const preservedNames = new Set(preserved)
  return [...preserved, ...current.filter((name) => !preservedNames.has(name))]
}

export function readOmittedNames(
  saved: OmittedChildren | undefined,
  propertyType: string
): readonly string[] | undefined {
  if (saved === undefined) return undefined
  if (saved.kind !== "names") {
    throw new Error(`${propertyType} ожидает omittedChildren.kind = names`)
  }
  return saved.names
}

export function readOmittedTypedNames(
  saved: OmittedChildren | undefined,
  propertyType: string
): readonly { xmlName: string; name: string }[] | undefined {
  if (saved === undefined) return undefined
  if (saved.kind !== "typedNames") {
    throw new Error(`${propertyType} ожидает omittedChildren.kind = typedNames`)
  }
  return saved.items
}

function assertUniqueNames(names: readonly string[]): void {
  const seen = new Set<string>()
  for (const name of names) {
    if (seen.has(name)) throw new Error(`Дублирующееся имя ${name} в omittedChildren`)
    seen.add(name)
  }
}
