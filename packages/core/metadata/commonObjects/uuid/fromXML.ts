import { ConfigurationContextFromXML } from "../../context/types"
import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"

export const importUUIDFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  value: string | undefined
): string | undefined => {
  if (value === undefined) return undefined
  return String(value)
}

export const metadataPropertyRule000 = definePropertyTypeRule("uuid", "importFromXML", importUUIDFromXML)
export const metadataPropertyRule001 = definePropertyTypeRule("uuid", "configurationIndexValueFromXML", {
  identityKind: "uuid",
})
