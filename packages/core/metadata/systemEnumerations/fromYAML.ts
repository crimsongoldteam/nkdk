import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "../forms/elements/calendarField/rules"
import { registerTypeRule } from "../orchestration/property/typeRuleRegistry"

/** @deprecated */
export const importSystemEnumerationFromYAMLDeprecated = <T extends string>(
  _context: ConfigurationContext,
  rule: PropertyRule,
  value: string | undefined
): T | undefined => {
  const systemEnumerationRule = rule as SE.SystemEnumerationPropertyRule

  if (!value) return undefined

  const enumeration = (SE as Record<string, Record<string, string>>)[systemEnumerationRule.typeSE! + "FromYAML"]

  if (!enumeration) throw new Error(`Enumeration ${systemEnumerationRule.typeSE} not found`)
  return enumeration[value] as T
}

export const importSystemEnumerationFromYAML = <T extends string>(params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: string | undefined
}): T | undefined => {
  const { rule, value } = params
  const systemEnumerationRule = rule as SE.SystemEnumerationPropertyRule

  if (value === undefined) return undefined

  const enumeration = (SE as Record<string, Record<string, string>>)[systemEnumerationRule.typeSE! + "FromYAML"]

  if (!enumeration) throw new Error(`Enumeration ${systemEnumerationRule.typeSE} not found`)
  return enumeration[value] as T | undefined
}

registerTypeRule("SystemEnumeration", "importFromYAML", importSystemEnumerationFromYAML)
