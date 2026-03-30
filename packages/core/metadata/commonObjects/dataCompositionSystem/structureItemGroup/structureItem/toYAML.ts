import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataItemToYAML } from "~/metadata/orchestration/metadataItem/toYAML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { StructureItem } from "./types"
import { StructureItemGroupRules } from "../rules"

const exportStructureItemElementToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  value: StructureItem[number] | undefined
) => {
  if (!value) return undefined

  if (value.itemType === "StructureItemGroup") {
    return exportMetadataItemToYAML({ context, data: value, rule: StructureItemGroupRules })
  }

  return undefined
}

export const exportStructureItemToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: StructureItem | undefined
) => {
  if (!value || value.length === 0) return undefined
  const exported = value.flatMap((item) => {
    const exportedItem = exportStructureItemElementToYAML(context, rule, item)
    return exportedItem ? [exportedItem] : []
  })
  return exported.length > 0 ? exported : undefined
}
