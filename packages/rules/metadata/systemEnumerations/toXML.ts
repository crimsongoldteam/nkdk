import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import * as SE from "./types"
import { applySystemEnumerationXMLAlias } from "./xmlAliases"

export function exportSystemEnumerationToXML(
  _context: ConfigurationContextWithExportToXML,
  rule: PropertyRule,
  value: string | undefined,
  _referenceValue?: string
): string | undefined {
  if (value === undefined) return undefined
  const systemEnumerationRule = rule as SE.SystemEnumerationPropertyRule
  return applySystemEnumerationXMLAlias(systemEnumerationRule.typeSE, "toXML", value)
}

export const metadataPropertyRule000 = definePropertyTypeRule("SystemEnumeration", "exportToXML", exportSystemEnumerationToXML)
