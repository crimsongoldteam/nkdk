import type { ConfigurationIndexChild, ConfigurationIndexExportRuntime } from "@nkdk/runtime"

export function orderAndPersistNamedChildren(params: {
  readonly xmlName: string
  readonly names: readonly string[]
  readonly saved?: readonly ConfigurationIndexChild[]
  readonly runtime?: ConfigurationIndexExportRuntime
}): string[] {
  const canonical = canonicalNamedChildren(params.xmlName, params.names)
  const orderedChildren = mergeSavedChildren(canonical, params.saved, canonical)
  const children = childrenToPersist(orderedChildren, canonical)
  if (children !== undefined && params.runtime !== undefined) {
    params.runtime.collector.setChildren(
      params.runtime.xmlNodeLogicalAddress ?? params.runtime.logicalAddress,
      children,
    )
  }
  return orderedChildren.map(({ name }) => name)
}

export function canonicalNamedChildren(
  xmlName: string,
  names: readonly string[],
): ConfigurationIndexChild[] {
  const result = names.map((name) => ({ xmlName, name }))
  assertUniqueChildren(result)
  return result.sort((left, right) => compareUtf8(left.name, right.name))
}

export function mergeSavedChildren(
  current: readonly ConfigurationIndexChild[],
  saved: readonly ConfigurationIndexChild[] | undefined,
  canonical: readonly ConfigurationIndexChild[],
): ConfigurationIndexChild[] {
  assertUniqueChildren(current)
  assertUniqueChildren(canonical)
  if (saved === undefined) return canonical.map(copyChild)
  assertUniqueChildren(saved)
  const currentByKey = new Map(current.map((child) => [childKey(child), child]))
  const preserved = saved.flatMap((child) => {
    const actual = currentByKey.get(childKey(child))
    return actual === undefined ? [] : [actual]
  })
  const preservedKeys = new Set(preserved.map(childKey))
  return [
    ...preserved.map(copyChild),
    ...canonical.filter((child) => !preservedKeys.has(childKey(child))).map(copyChild),
  ]
}

export function childrenToPersist(
  actual: readonly ConfigurationIndexChild[],
  canonical: readonly ConfigurationIndexChild[],
): ConfigurationIndexChild[] | undefined {
  assertUniqueChildren(actual)
  assertUniqueChildren(canonical)
  return equalChildren(actual, canonical) ? undefined : actual.map(copyChild)
}

function assertUniqueChildren(children: readonly ConfigurationIndexChild[]): void {
  const seen = new Set<string>()
  for (const child of children) {
    if (child.xmlName.length === 0 || child.name.length === 0) throw new Error("Пустое поле children")
    const key = childKey(child)
    if (seen.has(key)) throw new Error(`Дублирующийся child ${child.xmlName}/${child.name}`)
    seen.add(key)
  }
}

function equalChildren(
  left: readonly ConfigurationIndexChild[],
  right: readonly ConfigurationIndexChild[],
): boolean {
  return left.length === right.length && left.every(
    (child, index) => child.xmlName === right[index]?.xmlName && child.name === right[index]?.name,
  )
}

function childKey(child: ConfigurationIndexChild): string {
  return `${child.xmlName}\0${child.name}`
}

function copyChild(child: ConfigurationIndexChild): ConfigurationIndexChild {
  return { xmlName: child.xmlName, name: child.name }
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}
