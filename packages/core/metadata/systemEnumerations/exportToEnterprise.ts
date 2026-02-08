import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "../forms/elements/calendarField/rules"
import { registerTypeRule, SystemEnumerationPropertyRule } from "../metadataFactory"

/** @deprecated */
export const exportSystemEnumerationToEnterprise = <T extends string>(
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
  value: string | undefined,
  enumeration: Record<string, T>
): T | undefined => {
  if (!value) return undefined

  return enumeration[value] as T
}

export const exportSystemEnumerationToYAML = <T extends string>(
  _context: ConfigurationContext,
  rule: SystemEnumerationPropertyRule<any>,
  value: string | undefined
): T | undefined => {
  if (!value) return undefined

  const enumeration = (SE as Record<string, Record<string, string>>)[rule.typeSE + "ToEnterprise"]

  if (!enumeration) throw new Error(`Enumeration ${rule!.typeSE} not found`)
  return enumeration[value] as T
}

registerTypeRule("SystemEnumeration", "exportToEnterprise", exportSystemEnumerationToYAML as any)
