import { ConfigurationContextWithExportToXML } from "../../context/types"
import { PropertyRule } from "../../orchestration"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { StringOrNumber, StringOrNumberReference } from "./types"

const isReference = (value: unknown): value is StringOrNumberReference =>
  typeof value === "object" && value !== null && "value" in value

export const exportStringOrNumberToXML = (
  _context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  value: StringOrNumber | StringOrNumberReference | undefined,
  referenceMetadata?: StringOrNumber | StringOrNumberReference
): string | number | { "_xsi:type": string; "#text": string } | undefined => {
  if (value === undefined) return undefined
  const actualValue = isReference(value) ? value.value : value
  const reference = isReference(referenceMetadata) ? referenceMetadata : undefined

  if (typeof actualValue === "number" && reference?.xsiType) {
    return { "_xsi:type": reference.xsiType, "#text": String(actualValue) }
  }

  return actualValue
}

registerTypeRule("StringOrNumber", "exportToXML", exportStringOrNumberToXML)
