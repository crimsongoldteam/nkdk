import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { importMetadataValueFromYAML } from "../metadataValue/fromYAML"
import { MobileDeviceCommandBarContent, MobileDeviceCommandBarContentYAML } from "./types"

export const importMobileDeviceCommandBarContentFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: MobileDeviceCommandBarContentYAML | undefined
): MobileDeviceCommandBarContent | undefined => {
  if (!yaml || yaml.length === 0) return undefined

  const items = yaml
    .map((item) => importMetadataValueFromYAML(context, { type: "MetadataValue" }, item))
    .filter((item): item is MobileDeviceCommandBarContent[number] => item !== undefined)

  return items.length === 0 ? undefined : items
}

registerTypeRule("MobileDeviceCommandBarContent", "importFromYAML", importMobileDeviceCommandBarContentFromYAML)
