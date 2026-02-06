import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "../forms/elements/calendarField/rules"
import { registerTypeRule, SystemEnumerationPropertyRule } from "../metadataFactory"
import { SystemEnumerationPreview } from "./types"

/** @deprecated */
export const exportSystemEnumerationDeprecatedToPreview = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined,
  enumerationName: string
): SystemEnumerationPreview | undefined => {
  if (!value) return undefined
  return {
    Type: "SystemEnumeration",
    Value: `${enumerationName}.${value}`,
  }
}

export const exportSystemEnumerationToPreview = (
  _context: ConfigurationContext,
  rule: SystemEnumerationPropertyRule,
  value: string | undefined
): SystemEnumerationPreview | undefined => {
  if (!value) return undefined

  const enumerationName = rule.typeSE

  return {
    Type: "SystemEnumeration",
    Value: `${enumerationName}.${value}`,
  }
}

registerTypeRule("SystemEnumeration", "exportToPreview", exportSystemEnumerationToPreview as any)
