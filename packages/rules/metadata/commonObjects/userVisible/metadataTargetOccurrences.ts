import {
  renameMetadataTargetMappingKey,
  type MetadataTargetConstraint,
  type MetadataTargetOccurrence,
  type MetadataTargetOccurrencesFunction,
} from "@nkdk/runtime/rule-kit"
import { parseMetadataTargetFromModel } from "../metadataTargets/parse"

export const userVisibleRoleTarget = {
  kind: "object",
  roots: ["Role"],
} as const satisfies MetadataTargetConstraint

export const collectUserVisibleMetadataTargetOccurrences: MetadataTargetOccurrencesFunction = (params) => {
  if (params.representation === "model") {
    return userVisibleValues(params.value).map((item): MetadataTargetOccurrence => ({
      location: {
        kind: "key",
        path: [...params.yamlPath, "Роли"],
        key: roleNameFromCanonical(item.name),
      },
      constraint: userVisibleRoleTarget,
      representation: isUuid(item.name)
        ? { kind: "brokenXMLReference", payload: item.name, grammar: "uuid" }
        : { kind: "canonical", canonical: item.name },
      setValue: (nextValue) => { item.name = nextValue },
    }))
  }

  const visible = userVisibleYAMLValue(params.value, params.propRule.yaml)
  if (visible === undefined || !isRecord(visible.Роли)) return []
  const roles = visible.Роли
  return Object.keys(roles).map((key): MetadataTargetOccurrence => ({
    location: { kind: "key", path: [...params.yamlPath, "Роли"], key },
    constraint: userVisibleRoleTarget,
    representation: isUuid(key)
      ? { kind: "brokenXMLReference", payload: key, grammar: "uuid" }
      : { kind: "canonical", canonical: key },
    setValue: (nextValue) => renameMetadataTargetMappingKey(roles, key, nextValue),
  }))
}

function roleNameFromCanonical(value: string): string {
  const parsed = parseMetadataTargetFromModel({ canonical: value, constraint: userVisibleRoleTarget })
  return parsed.ok && parsed.target.kind === "object" ? parsed.target.objectName : value
}

function userVisibleValues(value: unknown): Array<{ name: string; value: unknown }> {
  if (!isRecord(value) || !Array.isArray(value.values)) return []
  return value.values.filter((item): item is { name: string; value: unknown } =>
    isRecord(item) && typeof item.name === "string")
}

function userVisibleYAMLValue(
  value: unknown,
  yamlKey: string | undefined,
): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined
  if (isRecord(value.Роли)) return value
  return typeof yamlKey === "string" && isRecord(value[yamlKey])
    ? value[yamlKey] as Record<string, unknown>
    : undefined
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
