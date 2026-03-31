import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportPropertyToYAML, PropertyRule } from "~/metadata/orchestration"
import { StructureItemGroupRules } from "./rules"
import type { StructureItemGroup, StructureItemGroupYAML } from "./types"

type ToYAMLParams = {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: unknown
  name?: string
}

export const exportStructureItemGroupToYAML = (
  params: ToYAMLParams
): StructureItemGroupYAML | undefined => {
  if (!params.value || typeof params.value !== "object" || Array.isArray(params.value)) return undefined

  const result: string[] = []
  const stack: StructureItemGroup[] = [params.value as StructureItemGroup]
  const groupItemsRule = StructureItemGroupRules.properties.groupItems as PropertyRule

  while (stack.length > 0) {
    const current = stack.shift()!

    const exportedGroupItems = exportPropertyToYAML({
      context: params.context,
      rule: groupItemsRule,
      value: current.groupItems,
    })
    const groupItemsYaml = exportedGroupItems?.[groupItemsRule.yaml!]

    if (Array.isArray(groupItemsYaml)) {
      result.push(...groupItemsYaml.filter((item): item is string => typeof item === "string"))
    }

    const nestedItems = normalizeStructureItems(current.item)
    if (nestedItems.length > 0) stack.push(...nestedItems)
  }

  return result.length > 0 ? result : undefined
}

const normalizeStructureItems = (value: unknown): StructureItemGroup[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is StructureItemGroup => !!item && typeof item === "object" && !Array.isArray(item)
    )
  }
  if (typeof value === "object") return [value as StructureItemGroup]
  return []
}
