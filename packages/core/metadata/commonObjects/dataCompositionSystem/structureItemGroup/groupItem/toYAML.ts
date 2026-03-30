import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataItemToYAML } from "~/metadata/orchestration/metadataItem/toYAML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { GroupItem } from "./types"
import { GroupItemAutoRules, GroupItemFieldRules } from "./rules"

const exportGroupItemElementToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  value: GroupItem[number] | undefined
) => {
  if (!value) return undefined

  if (value.itemType === "GroupItemField") {
    return exportMetadataItemToYAML({ context, data: value, rule: GroupItemFieldRules })
  }

  if (value.itemType === "GroupItemAuto") {
    const y = exportMetadataItemToYAML({ context, data: value, rule: GroupItemAutoRules })
    return y !== undefined && Object.keys(y).length > 0 ? y : {}
  }

  return undefined
}

export const exportGroupItemToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: GroupItem | undefined
) => {
  if (!value || value.length === 0) return undefined
  const exported = value.flatMap((item) => {
    const exportedItem = exportGroupItemElementToYAML(context, rule, item)
    return exportedItem ? [exportedItem] : []
  })
  return exported.length > 0 ? exported : undefined
}
