import { ConfigurationContext } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"
import { exportMetadataValueToYAML } from "../metadataValue/toYAML"
import { MetadataStringValue } from "../metadataValue/types"
import { MobileDeviceCommandBarContent, MobileDeviceCommandBarContentYAML } from "./types"

export const exportMobileDeviceCommandBarContentToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MobileDeviceCommandBarContent | undefined
): MobileDeviceCommandBarContentYAML | undefined => {
  if (!data || data.length === 0) return undefined

  const items = data
    .map((item) =>
      item.type === "string"
        ? (item as MetadataStringValue).value
        : exportMetadataValueToYAML(context, { type: "MetadataValue" }, item)
    )
    .filter((item): item is MobileDeviceCommandBarContentYAML[number] => item !== undefined)

  return items.length === 0 ? undefined : items
}

export const metadataPropertyRule000 = definePropertyTypeRule("MobileDeviceCommandBarContent", "exportToYAML", exportMobileDeviceCommandBarContentToYAML)
