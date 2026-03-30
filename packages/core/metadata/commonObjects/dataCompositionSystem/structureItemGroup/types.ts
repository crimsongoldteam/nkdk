import { registerMetadataItemRule } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { exportMetadataItemToXML } from "~/metadata/orchestration/metadataItem/toXML"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import type { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import "./groupItem/types"
import "./structureItem/types"
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
