import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { ExportToXMLFunctionNew } from "~/metadata/orchestration"
import { exportMetadataItemToXML } from "~/metadata/orchestration/metadataItem/toXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { GroupItem } from "./types"
import { GroupItemAutoRules, GroupItemFieldRules } from "./rules"

const exportGroupItemElementToXML = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: GroupItem[number] | undefined
}) => {
  const { context, value } = params
  if (!value) return undefined

  if (value.itemType === "GroupItemField") {
    return {
      "_xsi:type": "dcsset:GroupItemField",
      ...exportMetadataItemToXML({
        context,
        data: value,
        rule: GroupItemFieldRules,
      }),
    }
  }

  if (value.itemType === "GroupItemAuto") {
    const body = exportMetadataItemToXML({
      context,
      data: value,
      rule: GroupItemAutoRules,
    })
    return {
      "_xsi:type": "dcsset:GroupItemAuto",
      ...(body && Object.keys(body).length > 0 ? body : {}),
    }
  }

  return undefined
}

export const exportGroupItemToXML: ExportToXMLFunctionNew = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: GroupItem | undefined
}) => {
  const { context, rule, value } = params
  if (!value || value.length === 0) return undefined
  const exported = value.flatMap((item) => {
    const xml = exportGroupItemElementToXML({ context, rule, value: item })
    return xml ? [xml] : []
  })
  if (exported.length === 0) return undefined
  return { "dcsset:item": exported }
}
