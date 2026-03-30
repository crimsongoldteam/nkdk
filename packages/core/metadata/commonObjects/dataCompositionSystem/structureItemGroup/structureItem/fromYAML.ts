import { ConfigurationContext } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration/metadataItem/fromYAML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { StructureItem } from "./types"
import { StructureItemGroupRules } from "../rules"

const importStructureItemElementFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  value: unknown
): StructureItem[number] | undefined => {
  if (value === undefined || value === null || typeof value !== "object") return undefined
  return importMetadataItemFromYAML({
    context,
    rule: StructureItemGroupRules,
    yaml: value as Record<string, unknown>,
  }) as StructureItem[number]
}

export const importStructureItemFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: unknown
): StructureItem | undefined => {
  if (!value || !Array.isArray(value)) return undefined
  const imported = value.flatMap((item) => {
    const importedItem = importStructureItemElementFromYAML(context, rule, item)
    return importedItem ? [importedItem] : []
  })
  return imported.length > 0 ? imported : undefined
}
