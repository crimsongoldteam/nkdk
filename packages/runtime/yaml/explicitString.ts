export type YAMLStyleKey = string | number

const explicitYAMLStringKind = Symbol("explicitYAMLString")
const doubleQuotedScalarMarks = new WeakMap<object, Set<YAMLStyleKey>>()

export interface ExplicitYAMLString {
  readonly [explicitYAMLStringKind]: true
  readonly value: string
}

export interface DoubleQuotedScalarMarkSnapshotEntry {
  readonly parentPath: readonly YAMLStyleKey[]
  readonly key: YAMLStyleKey
}

export interface DoubleQuotedScalarMarksSnapshot {
  readonly version: 1
  readonly entries: readonly DoubleQuotedScalarMarkSnapshotEntry[]
}

export function explicitYAMLString(value: string): ExplicitYAMLString {
  return {
    [explicitYAMLStringKind]: true,
    value,
  }
}

export function isExplicitYAMLString(value: unknown): value is ExplicitYAMLString {
  return (
    value !== null &&
    typeof value === "object" &&
    (value as { [explicitYAMLStringKind]?: unknown })[explicitYAMLStringKind] === true &&
    typeof (value as { value?: unknown }).value === "string"
  )
}

export function unwrapExplicitYAMLString(value: unknown): unknown {
  return isExplicitYAMLString(value) ? value.value : value
}

export function markDoubleQuotedScalar(parent: object, key: YAMLStyleKey): void {
  const marks = doubleQuotedScalarMarks.get(parent)
  if (marks !== undefined) {
    marks.add(key)
    return
  }
  doubleQuotedScalarMarks.set(parent, new Set([key]))
}

export function copyDoubleQuotedScalarMarks(
  source: object,
  target: object,
  keys?: ReadonlySet<YAMLStyleKey>,
): void {
  const marks = doubleQuotedScalarMarks.get(source)
  if (marks === undefined) return
  for (const key of marks) {
    if (keys === undefined || keys.has(key)) markDoubleQuotedScalar(target, key)
  }
}

export function asExplicitYAMLStringIfMarked(parent: unknown, key: YAMLStyleKey, value: unknown): unknown {
  if (parent === null || typeof parent !== "object") return value
  if (typeof value !== "string") return value
  return doubleQuotedScalarMarks.get(parent)?.has(key) === true ? explicitYAMLString(value) : value
}

export function snapshotDoubleQuotedScalarMarks(root: unknown): DoubleQuotedScalarMarksSnapshot {
  const entries: DoubleQuotedScalarMarkSnapshotEntry[] = []
  if (!isObject(root)) return { version: 1, entries }
  const visited = new WeakSet<object>()

  const visit = (parent: object, parentPath: readonly YAMLStyleKey[]): void => {
    if (visited.has(parent)) return
    visited.add(parent)
    for (const key of doubleQuotedScalarMarks.get(parent) ?? []) entries.push({ parentPath, key })
    for (const rawKey of Object.keys(parent)) {
      const key = Array.isArray(parent) ? Number(rawKey) : rawKey
      const child = (parent as Record<YAMLStyleKey, unknown>)[key]
      if (isObject(child)) visit(child, [...parentPath, key])
    }
  }

  visit(root, [])
  return { version: 1, entries }
}

export function restoreDoubleQuotedScalarMarks(
  root: unknown,
  snapshot: DoubleQuotedScalarMarksSnapshot,
): void {
  for (const entry of snapshot.entries) {
    const parent = valueAtPath(root, entry.parentPath)
    if (isObject(parent)) markDoubleQuotedScalar(parent, entry.key)
  }
}

function valueAtPath(root: unknown, path: readonly YAMLStyleKey[]): unknown {
  let current = root
  for (const key of path) {
    if (!isObject(current)) return undefined
    current = (current as Record<YAMLStyleKey, unknown>)[key]
  }
  return current
}

function isObject(value: unknown): value is object {
  return value !== null && typeof value === "object"
}
