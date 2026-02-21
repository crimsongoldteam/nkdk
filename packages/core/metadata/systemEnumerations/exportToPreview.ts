import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "../forms/elements/calendarField/rules"
import { SystemEnumerationPropertyRule } from "../metadataFactory"
import { registerTypeRule } from "../metadataFactory/types/factory"
import { SystemEnumerationEnterprise } from "./types"

/** @deprecated */
export const exportSystemEnumerationDeprecatedToPreview = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
  value: string | undefined,
  enumerationName: string
): SystemEnumerationEnterprise | undefined => {
  if (!value) return undefined
  return {
    Type: "SystemEnumeration",
    Value: `${enumerationName}.${value}`,
  }
}

export const exportSystemEnumerationToPreview = (
  _context: ConfigurationContext,
  rule: SystemEnumerationPropertyRule<any>,
  value: string | undefined
): SystemEnumerationEnterprise | undefined => {
  if (!value) return undefined

  const enumerationName = rule.typeSE

  return {
    Type: "SystemEnumeration",
    Value: `${enumerationName}.${value}`,
  }
}

registerTypeRule("SystemEnumeration", "exportToPreview", exportSystemEnumerationToPreview as any)
