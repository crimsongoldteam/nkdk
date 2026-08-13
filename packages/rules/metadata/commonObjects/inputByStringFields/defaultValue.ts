type YAMLRoot = Readonly<Record<string, unknown>>

export interface InputByStringStandardField {
  yaml: string
  length: {
    propertyKey: string
    yaml: string
    implicitValue: number
  }
}

interface InputByStringDefaultsRule {
  standardFields: readonly InputByStringStandardField[]
}

export function effectiveInputByStringLength(
  field: InputByStringStandardField,
  yaml: unknown
): number {
  const root = isYAMLRoot(yaml) ? yaml : {}
  const explicit = root[field.length.yaml]
  return typeof explicit === "number" ? explicit : field.length.implicitValue
}

export function inputByStringDefaultYAML(
  rule: InputByStringDefaultsRule,
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
