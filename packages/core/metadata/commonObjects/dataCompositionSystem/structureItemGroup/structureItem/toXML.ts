import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { ExportToXMLFunctionNew } from "~/metadata/orchestration"
import { exportMetadataItemToXML } from "~/metadata/orchestration/metadataItem/toXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { StructureItem } from "./types"
import { StructureItemGroupRules } from "../rules"

const exportStructureItemElementToXML = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: StructureItem[number] | undefined
}) => {
  const { context, value } = params
  if (!value) return undefined

  if (value.itemType === "StructureItemGroup") {
    return {
      "_xsi:type": "dcsset:StructureItemGroup",
      ...exportMetadataItemToXML({
        context,
        data: value,
        rule: StructureItemGroupRules,
      }),
    }
  }

  return undefined
}

export const exportStructureItemToXML: ExportToXMLFunctionNew = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: StructureItem | undefined
}) => {
  const { context, rule, value } = params
  if (!value || value.length === 0) return undefined
  const exported = value.flatMap((item) => {
    const xml = exportStructureItemElementToXML({ context, rule, value: item })
    return xml ? [xml] : []
  })
  return exported.length > 0 ? exported : undefined
}
