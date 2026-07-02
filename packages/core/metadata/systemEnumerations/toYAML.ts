import * as SE from "./types"
import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "../forms/elements/calendarField/rules"
import { ExportToYAMLFunction } from "../orchestration"
import { registerTypeRule } from "../orchestration/property/typeRuleRegistry"

const systemEnumerationTables = SE as unknown as Record<string, Record<string, string>>

/** @deprecated */
export const exportSystemEnumerationToYAMLDeprecated = <T extends string>(
  _context: ConfigurationContext,
  rule: PropertyRule,
  value: string | undefined,
  enumeration?: Record<string, T>
): T | undefined => {
  if (!value) return undefined

  if (enumeration) {
    return enumeration[value] as T
  }

  const systemEnumerationRule = rule as SE.SystemEnumerationPropertyRule

  const enumerationToYAML = systemEnumerationTables[systemEnumerationRule.typeSE + "ToYAML"]
  if (!enumerationToYAML) throw new Error(`Enumeration ${systemEnumerationRule.typeSE} not found`)
  return enumerationToYAML[value] as T
}

export const exportSystemEnumerationToYAML = <T extends string>(
  _context: ConfigurationContext,
  rule: SE.SystemEnumerationPropertyRule,
  value: string | undefined
): T | undefined => {
  if (value === undefined) return undefined

  const enumeration = systemEnumerationTables[rule.typeSE + "ToYAML"]

  if (!enumeration) throw new Error(`Enumeration ${rule!.typeSE} not found`)
  return enumeration[value] as T | undefined
}

registerTypeRule("SystemEnumeration", "exportToYAML", exportSystemEnumerationToYAML as ExportToYAMLFunction)
