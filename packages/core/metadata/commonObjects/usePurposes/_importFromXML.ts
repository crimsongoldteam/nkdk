import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { _importMetadataValueFromXML } from "../metadataValue/_importFromXML"
import { UsePurposes, UsePurposesXML } from "./types"

export const _importUsePurposesFromXML = (
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
    const metadataValue = _importMetadataValueFromXML(context, undefined, _rule, value, "string")
    if (metadataValue && metadataValue.type === "string") {
      const stringValue = metadataValue.value as string
      if (stringValue === "PlatformApplication" || stringValue === "MobilePlatformApplication") {
        result.push(stringValue)
      }
    }
  }

  return result.length > 0 ? result : undefined
}
