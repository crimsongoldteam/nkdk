import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "../metadataFactory/elementRulesFactory"
import { getTypeRule } from "../metadataFactory/typeRulesFactory"
import { exportSystemEnumerationToPreview } from "../systemEnumerations/exportToPreview"
import { exportSystemEnumerationToYAML } from "../systemEnumerations/exportToEnterprise"
import { importSystemEnumerationFromYAML } from "../systemEnumerations/importFromEnterprise"

export interface TypeRule {
  importFromXML?: (...args: any[]) => any
  exportToXML?: (...args: any[]) => any
  importFromEnterprise?: (...args: any[]) => any
  exportToEnterprise?: (...args: any[]) => any
  exportToPreview?: (...args: any[]) => any
}

export const importPropertyFromXML = (context: ConfigurationContext, propertyRule: PropertyRule, data: any): any => {
  const ruleFunction = getTypeRule(propertyRule.type as any, "importFromXML")

  if (ruleFunction === undefined) return data

  const result = ruleFunction(context, propertyRule, data)

  return result
}

export const TypeRules: Record<string, TypeRule> = {
  SystemEnumeration: {
    importFromEnterprise: importSystemEnumerationFromYAML,
    exportToEnterprise: exportSystemEnumerationToYAML,
    exportToPreview: exportSystemEnumerationToPreview,
  },
}
