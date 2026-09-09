import {
  renameMetadataTargetMappingKey,
  type MetadataTargetOccurrence,
  type MetadataTargetOccurrencesFunction,
} from "@nkdk/runtime/rule-kit"
import { userVisibleRoleTarget } from "../userVisible/metadataTargetOccurrences"
import { parseMetadataTargetFromModel } from "../metadataTargets/parse"

export const collectCommandVisibilityRoleOccurrences: MetadataTargetOccurrencesFunction = (params) => {
  if (!Array.isArray(params.value)) return []
  return params.value.flatMap((entry, index) => collectRoles(params, entry, [...params.yamlPath, index]))
}

export const collectSubsystemVisibilityRoleOccurrences: MetadataTargetOccurrencesFunction = (params) => {
  if (!isRecord(params.value)) return []
  return Object.entries(params.value).flatMap(([name, entry]) => collectRoles(params, entry, [...params.yamlPath, name]))
}

function collectRoles(
  params: Parameters<MetadataTargetOccurrencesFunction>[0],
  entry: unknown,
  path: readonly (string | number)[],
): MetadataTargetOccurrence[] {
  if (!isRecord(entry)) return []
  const visibility = params.representation === "model" && params.propRule.type === "CommandInterfaceVisibilityMap"
    ? entry.visibility : entry
  if (!isRecord(visibility)) return []
  const roles = params.representation === "model" ? visibility.roles : visibility.Роли
  if (!isRecord(roles)) return []
  return Object.keys(roles).map((key): MetadataTargetOccurrence => {
    const parsed = params.representation === "model"
      ? parseMetadataTargetFromModel({ canonical: key, constraint: userVisibleRoleTarget }) : undefined
    const yamlKey = parsed?.ok && parsed.target.kind === "object" ? parsed.target.objectName : key
    return {
      location: { kind: "key", path: [...path, "Роли"], key: yamlKey },
      constraint: userVisibleRoleTarget,
      representation: { kind: "canonical", canonical: key },
      setValue: nextValue => renameMetadataTargetMappingKey(roles, key, nextValue),
    }
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
