import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "../forms/elements/calendarField/rules"
import { registerTypeRule } from "../metadataFactory"

export const importSystemEnumerationFromEnterprise = <T extends string>(
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined,
  enumeration: Record<string, T>
): T | undefined => {
  if (!value) return undefined

  return enumeration[value] as T
}

export const importSystemEnumerationFromYAML = <T extends string>(
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: string | undefined
): T | undefined => {
  if (!value) return undefined

  const enumeration = (SE as Record<string, Record<string, string>>)[rule!.typeSE! + "FromEnterprise"]

  if (!enumeration) throw new Error(`Enumeration ${rule!.typeSE} not found`)
  return enumeration[value] as T
}

registerTypeRule("SystemEnumeration", "importFromEnterprise", importSystemEnumerationFromYAML)
