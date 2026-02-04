import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { importMetadataValueFromXML } from "../metadataValue/importFromXML"
import { UsePurposes, UsePurposesXML } from "./types"

export const importUsePurposesFromXML = (
  context: ConfigurationContext,
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