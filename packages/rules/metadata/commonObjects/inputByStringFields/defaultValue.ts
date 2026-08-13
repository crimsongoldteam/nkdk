import type { InputByStringFieldsWidePropertyRule, InputByStringStandardField } from "./types"

type YAMLRoot = Readonly<Record<string, unknown>>

export function effectiveInputByStringLength(
  field: InputByStringStandardField,
  yaml: unknown
): number {
  const root = isYAMLRoot(yaml) ? yaml : {}
  const explicit = root[field.length.yaml]
  return typeof explicit === "number" ? explicit : field.length.implicitValue
}

export function inputByStringDefaultYAML(
  rule: InputByStringFieldsWidePropertyRule,
  yaml: unknown
): string[] {
  return rule.standardFields
    .filter((field) => effectiveInputByStringLength(field, yaml) > 0)
    .map((field) => field.yaml)
}

export function orderedEqual(left: readonly unknown[], right: readonly unknown[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function isYAMLRoot(value: unknown): value is YAMLRoot {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
