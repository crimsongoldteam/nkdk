import { definePropertyTypeRule } from "../../ruleRuntime/property/propertyRuleRegistrySet"
import { ConfigurationContext } from "../../context/types"
import { PropertyRule } from "../../ruleRuntime"
import { exportMetadataValueToXML } from "../metadataValue/toXML"
import {
  MobileDeviceCommandBarContent,
  MobileDeviceCommandBarContentItemXML,
  MobileDeviceCommandBarContentXML,
} from "./types"

export const exportMobileDeviceCommandBarContentToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: MobileDeviceCommandBarContent | undefined
): MobileDeviceCommandBarContentXML | undefined => {
  if (!value || value.length === 0) return undefined

  const items: MobileDeviceCommandBarContentItemXML[] = value.map((item) => ({
    "xr:Presentation": "",
    "xr:CheckState": 0,
    "xr:Value": exportMetadataValueToXML({
      context,
      rule: { type: "MetadataValue" },
      value: item,
    }),
  }))

  return {
    "xr:Item": items,
  }
}

export const metadataPropertyRule000 = definePropertyTypeRule("MobileDeviceCommandBarContent", "exportToXML", exportMobileDeviceCommandBarContentToXML)
