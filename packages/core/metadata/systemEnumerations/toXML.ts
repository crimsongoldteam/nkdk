import type { ConfigurationContextWithExportToXML } from "../context/types"
import type { PropertyRule } from "../orchestration/property/types"
import { registerTypeRule } from "../orchestration/property/typeRuleRegistry"
import * as SE from "./types"

const systemEnumerationTables = SE as unknown as Record<string, Record<string, string>>

export function exportSystemEnumerationToXML(
  _context: ConfigurationContextWithExportToXML,
  rule: PropertyRule,
  value: string | undefined,
  referenceValue?: string
): string | undefined {
  if (value === undefined || referenceValue === undefined) return value

  const systemEnumerationRule = rule as SE.SystemEnumerationPropertyRule
  const toYAML = systemEnumerationTables[`${systemEnumerationRule.typeSE}ToYAML`]
  if (toYAML?.[value] !== undefined && toYAML[value] === toYAML[referenceValue]) return referenceValue
  return value
}

registerTypeRule("SystemEnumeration", "exportToXML", exportSystemEnumerationToXML)
