import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { exportMetadataValueToXML } from "../metadataValue/toXML"
import { MobileDeviceCommandBarContent, MobileDeviceCommandBarContentItemXML, MobileDeviceCommandBarContentXML } from "./types"

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

registerTypeRule("MobileDeviceCommandBarContent", "exportToXML", exportMobileDeviceCommandBarContentToXML)
