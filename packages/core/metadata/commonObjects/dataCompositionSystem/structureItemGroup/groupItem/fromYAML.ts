import { ConfigurationContext } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration/metadataItem/fromYAML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { GroupItem, GroupItemFieldYAML } from "./types"
import { GroupItemAutoRules, GroupItemFieldRules } from "./rules"

const isGroupItemFieldYAML = (value: unknown): value is GroupItemFieldYAML => {
  return Boolean(value && typeof value === "object" && "Поле" in (value as object))
}

const importGroupItemElementFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  value: unknown
): GroupItem[number] | undefined => {
  if (value === undefined || value === null) return undefined
  if (!isGroupItemFieldYAML(value)) {
    return importMetadataItemFromYAML({
      context,
      rule: GroupItemAutoRules,
      yaml: (value as Record<string, unknown>) ?? {},
    }) as GroupItem[number]
  }
  return importMetadataItemFromYAML({
    context,
    rule: GroupItemFieldRules,
    yaml: value,
  }) as GroupItem[number]
}

export const importGroupItemFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: unknown
): GroupItem | undefined => {
  if (!value || !Array.isArray(value)) return undefined
  const imported = value.flatMap((item) => {
    const importedItem = importGroupItemElementFromYAML(context, rule, item)
    return importedItem ? [importedItem] : []
  })
  return imported.length > 0 ? imported : undefined
}
