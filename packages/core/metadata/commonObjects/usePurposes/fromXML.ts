import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importMetadataValueFromXML } from "../metadataValue/fromXML"
import { UsePurposes, UsePurposesXML } from "./types"
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
    const metadataValue = importMetadataValueFromXML(context, undefined, value, "string")
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
