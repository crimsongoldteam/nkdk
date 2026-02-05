import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "./elementRulesFactory"

export type TypeRulesNames =
  | "boolean"
  | "string"
  | "number"
  | "Border"
  | "Color"
  | "ExtendedTooltip"
  | "ContextMenu"
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

export type ImportExportFunction = (context: ConfigurationContext, rule: PropertyRule | undefined, value: any) => any

export interface TypeRule {
  importFromXML?: ImportExportFunction
  exportToXML?: ImportExportFunction
  importFromEnterprise?: ImportExportFunction
  exportToEnterprise?: ImportExportFunction
  exportToPreview?: ImportExportFunction
}

type TypeRulesOperations =
  | "importFromXML"
  | "exportToXML"
  | "importFromEnterprise"
  | "exportToEnterprise"
  | "exportToPreview"

const typeRulesRegistry = new Map<string, ImportExportFunction>()

type TypeRuleKey = `${TypeRulesNames}:${TypeRulesOperations}`

const createRegistryKey = (type: TypeRulesNames, operation: TypeRulesOperations): TypeRuleKey => {
  return `${type}:${operation}`
}

export function registerTypeRule(
  type: TypeRulesNames,
  operation: TypeRulesOperations,
  ruleFunction: ImportExportFunction
): void {
  const key = createRegistryKey(type, operation)
  typeRulesRegistry.set(key, ruleFunction)
}

export const getTypeRule = (type: TypeRulesNames, operation: TypeRulesOperations): ImportExportFunction | undefined => {
  const key = createRegistryKey(type, operation)
  const result = typeRulesRegistry.get(key)
  return result
}

export const clearTypeRulesRegistry = (): void => {
  typeRulesRegistry.clear()
}
