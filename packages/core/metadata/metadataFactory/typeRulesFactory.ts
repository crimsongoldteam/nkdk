import { ConfigurationContext } from "../context/types"
import { BaseElement } from "../forms/elements/baseElement/types"
import { PropertyRule } from "./elementRulesFactory"

export type TypeRulesNames =
  | "AssociatedTable"
  | "AutoCommandBar"
  | "TableAutoCommandBar"
  | "ChildItems"
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

/** @deprecated */
type ImportExportFunctionDepricated = (context: ConfigurationContext, rule: PropertyRule | undefined, value: any) => any

type ImportExportFunction = <T extends PropertyRule>(context: ConfigurationContext, rule: T, value: any) => any

type ImportFromEnterpriseFunction = <T extends BaseElement, P extends PropertyRule<T>>(
  context: ConfigurationContext,
  rule: P,
  value: any,
  source: T | undefined
) => T | undefined

export interface TypeRule {
  importFromXML?: ImportExportFunction | ImportExportFunctionDepricated
  exportToXML?: ImportExportFunction | ImportExportFunctionDepricated
  importFromEnterprise?: ImportFromEnterpriseFunction | ImportExportFunctionDepricated
  exportToEnterprise?: ImportExportFunction | ImportExportFunctionDepricated
  exportToPreview?: ImportExportFunction | ImportExportFunctionDepricated
}

type TypeRulesOperations =
  | "importFromXML"
  | "exportToXML"
  | "importFromEnterprise"
  | "exportToEnterprise"
  | "exportToPreview"

const typeRulesRegistry = new Map<
  string,
  ImportExportFunction | ImportFromEnterpriseFunction | ImportExportFunctionDepricated
>()

type TypeRuleKey = `${TypeRulesNames}:${TypeRulesOperations}`

const createRegistryKey = (type: TypeRulesNames, operation: TypeRulesOperations): TypeRuleKey => {
  return `${type}:${operation}`
}

export function registerTypeRule(
  type: TypeRulesNames,
  operation: TypeRulesOperations,
  ruleFunction: ImportExportFunction | ImportFromEnterpriseFunction | ImportExportFunctionDepricated
): void {
  const key = createRegistryKey(type, operation)
  typeRulesRegistry.set(key, ruleFunction)
}

export const getTypeRule = (
  type: TypeRulesNames,
  operation: TypeRulesOperations
): ImportExportFunction | ImportFromEnterpriseFunction | ImportExportFunctionDepricated | undefined => {
  const key = createRegistryKey(type, operation)
  const result = typeRulesRegistry.get(key)
  return result
}

export const clearTypeRulesRegistry = (): void => {
  typeRulesRegistry.clear()
}
