import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { importMetadataValueFromXML } from "../metadataValue/fromXML"
import type { UsePurposes, UsePurposesXML } from "./types"
import { ConfigurationContextFromXML } from "~/metadata/context/types"

export const importUsePurposesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: UsePurposesXML | undefined
): UsePurposes | undefined => {
  if (!xml) return undefined

  const values = xml["v8:Value"]
  if (!values) return undefined

  const valueArray = Array.isArray(values) ? values : [values]

  const result: UsePurposes = []

  for (const value of valueArray) {
    const metadataValue = importMetadataValueFromXML({ context, rule: undefined, value, type: "string" })
    if (metadataValue && metadataValue.type === "string") {
      const stringValue = metadataValue.value as string
      if (stringValue === "PlatformApplication" || stringValue === "MobilePlatformApplication") {
        result.push(stringValue)
      }
    }
  }

  return result.length > 0 ? result : undefined
}

registerTypeRule("UsePurposes", "importFromXML", importUsePurposesFromXML)
