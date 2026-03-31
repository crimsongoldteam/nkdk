import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import {
  PropertyRule,
  exportMetadataItemToXML,
  exportPropertyToYAML,
  registerMetadataItemRule,
  registerTypeRule,
} from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import "./collection/index"
import { StructureItemGroupRules } from "./rules"

export type StructureItemGroup = MetadataTypeByRule<typeof StructureItemGroupRules>
export type StructureItemGroupYAML = YAMLTypeByRule<typeof StructureItemGroupRules>

registerMetadataItemRule({
  propertyType: "StructureItemGroup",
  itemRule: StructureItemGroupRules,
})

registerTypeRule(
  "StructureItemGroup",
  "exportToXML",
  (params: {
    context: ConfigurationContextWithExportToXML
    rule: PropertyRule
    value: unknown
    referenceMetadata?: unknown
  }) => {
    if (!params.value || typeof params.value !== "object" || Array.isArray(params.value)) return undefined

    const inner = exportMetadataItemToXML({
      context: params.context,
      data: params.value as StructureItemGroup | undefined,
      rule: StructureItemGroupRules,
      referenceData: params.referenceMetadata as StructureItemGroup | undefined,
    })
    if (!inner) return undefined
    return {
      "_xsi:type": "dcsset:StructureItemGroup",
      ...inner,
    }
  }
)

registerTypeRule(
  "StructureItemGroup",
  "exportToYAML",
  (params: {
    context: ConfigurationContextWithExportToXML
    rule: PropertyRule
    value: unknown
    name?: string
  }): StructureItemGroupYAML | undefined => {
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
)

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
