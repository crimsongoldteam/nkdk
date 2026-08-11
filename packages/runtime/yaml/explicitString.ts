export type YAMLStyleKey = string | number

const explicitYAMLStringKind = Symbol("explicitYAMLString")
const doubleQuotedScalarMarks = new WeakMap<object, Set<YAMLStyleKey>>()

export interface ExplicitYAMLString {
  readonly [explicitYAMLStringKind]: true
  readonly value: string
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

export function asExplicitYAMLStringIfMarked(parent: unknown, key: YAMLStyleKey, value: unknown): unknown {
  if (parent === null || typeof parent !== "object") return value
  if (typeof value !== "string") return value
  return doubleQuotedScalarMarks.get(parent)?.has(key) === true ? explicitYAMLString(value) : value
}
