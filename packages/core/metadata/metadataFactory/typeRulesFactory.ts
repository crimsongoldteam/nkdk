import { ConfigurationContext } from "../context/types"

type TypeRulesNames =
  | "boolean"
  | "Border"
  | "Color"
  | "DynamicList"
  | "FieldsList"
  | "Font"
  | "FormattedI8nText"
  | "FormParameter"
  | "FunctionalOptionsProperty"
  | "I8nText"
  | "IndexField"
  | "MetadataField"
  | "MetadataValue"
  | "MetadataValueCollection"
  | "Picture"
  | "Predefined"
  | "TypeLink"
  | "TypeDescription"
  | "UsePurposes"
  | "UserVisible"
  | "ChoiceParameters"
  | "SystemEnumeration"

export interface TypeRule {
  importFromXML?: (context: ConfigurationContext, rule: PropertyKey, value: any) => any
  exportToXML?: (context: ConfigurationContext, rule: PropertyKey, value: any) => any
  importFromEnterprise?: (context: ConfigurationContext, rule: PropertyKey, value: any) => any
  exportToEnterprise?: (context: ConfigurationContext, rule: PropertyKey, value: any) => any
  exportToPreview?: (context: ConfigurationContext, rule: PropertyKey, value: any) => any
}

type TypeRulesOperations =
  | "importFromXML"
  | "exportToXML"
  | "importFromEnterprise"
  | "exportToEnterprise"
  | "exportToPreview"

const typeRulesRegistry = new Map<string, Function>()

type TypeRuleKey = `${TypeRulesNames}:${TypeRulesOperations}`

const createRegistryKey = (type: TypeRulesNames, operation: TypeRulesOperations): TypeRuleKey => {
  return `${type}:${operation}`
}

export function registerTypeRule(type: TypeRulesNames, operation: TypeRulesOperations, ruleFunction: Function): void {
  const key = createRegistryKey(type, operation)
  typeRulesRegistry.set(key, ruleFunction)
}

export const getTypeRule = (type: TypeRulesNames, operation: TypeRulesOperations): Function | undefined => {
  const key = createRegistryKey(type, operation)
  return typeRulesRegistry.get(key)
}

export const clearTypeRulesRegistry = (): void => {
  typeRulesRegistry.clear()
}
