import { ConfigurationContextWithExportToXML } from "../../../context/types"
import { exportMetadataItemToXML, PropertyRule } from "../../../orchestration"
import { StructureItemGroupRules } from "./rules"
import type { StructureItemGroup } from "./types"

type ToXMLParams = {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: unknown
  referenceMetadata?: unknown
}

export const exportStructureItemGroupToXML = (params: ToXMLParams): Record<string, unknown> | undefined => {
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
