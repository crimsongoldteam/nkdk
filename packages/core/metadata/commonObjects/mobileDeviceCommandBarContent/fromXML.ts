import { ConfigurationContextFromXML } from "../../context/types"
import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"
import { importMetadataValueFromXML } from "../metadataValue/fromXML"
import { MobileDeviceCommandBarContent, MobileDeviceCommandBarContentXML } from "./types"

export const importMobileDeviceCommandBarContentFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MobileDeviceCommandBarContentXML | undefined
): MobileDeviceCommandBarContent | undefined => {
  if (!xml || !xml["xr:Item"]) return undefined

  const rawItems = Array.isArray(xml["xr:Item"]) ? xml["xr:Item"] : [xml["xr:Item"]]
  const items = rawItems
    .map((item) => importMetadataValueFromXML({ context, rule: { type: "MetadataValue" }, value: item["xr:Value"] }))
    .filter((item): item is MobileDeviceCommandBarContent[number] => item !== undefined)

  return items.length === 0 ? undefined : items
}

export const metadataPropertyRule000 = definePropertyTypeRule("MobileDeviceCommandBarContent", "importFromXML", importMobileDeviceCommandBarContentFromXML)
