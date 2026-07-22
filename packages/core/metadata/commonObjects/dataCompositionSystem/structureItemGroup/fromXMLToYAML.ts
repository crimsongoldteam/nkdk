import { importMetadataItemFromXMLToYAML } from "../../../orchestration/metadataItem/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "../../../orchestration/property/importYamlTypes"
import { StructureItemGroupRules } from "./rules"

export const importStructureItemGroupFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  xml,
  name,
  traversal,
}) => {
  const yaml = importMetadataItemFromXMLToYAML({
    context,
    rule: StructureItemGroupRules,
    xml,
    name,
    traversal,
  })
  if (yaml === undefined || yaml === null || typeof yaml !== "object" || Array.isArray(yaml)) return undefined

  const record = yaml as Record<string, unknown>
  const result = [...asArray(record.ПоляГруппировки), ...asArray(record.Структура)]
  return result.length === 0 ? undefined : result
}

function asArray(value: unknown): unknown[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}
