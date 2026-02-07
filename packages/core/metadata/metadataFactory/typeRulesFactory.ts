import { ConfigurationContext } from "../context/types"
import { BaseElement } from "../forms/elements/baseElement/types"
import { PropertyRule } from "./elementRulesFactory"
import { ToPartialEnterpriseType } from "./types"

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

type ExportToXMLFunction = <T extends BaseElement, P extends PropertyRule<T>>(params: {
  context: ConfigurationContext
  rule: P
  value: T | undefined
}) => any | undefined

type ImportFromXMLFunction = <T extends BaseElement, P extends PropertyRule<T>>(params: {
  context: ConfigurationContext
  rule: P
  value: any
}) => T | undefined

type ImportFromEnterpriseFunction = <T extends BaseElement, P extends PropertyRule<T>>(params: {
  context: ConfigurationContext
  rule: P
  value: ToPartialEnterpriseType<T> | undefined
  source?: T
}) => T | undefined

type ExportToEnterpriseFunction = <T extends BaseElement, P extends PropertyRule<T>>(params: {
  context: ConfigurationContext
  rule: P
  value: T | undefined
}) => ToPartialEnterpriseType<T> | undefined

type ExportToPreviewFunction = <T extends BaseElement, P extends PropertyRule<T>>(params: {
  context: ConfigurationContext
  rule: P
  value: T | undefined
}) => any | undefined

export interface TypeRule {
  importFromXML?: ImportFromXMLFunction
  exportToXML?: ExportToXMLFunction
  importFromEnterprise?: ImportFromEnterpriseFunction
  exportToEnterprise?: ExportToEnterpriseFunction
  exportToPreview?: ExportToPreviewFunction
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

export const getTypeRule = <O extends TypeRulesOperations>(
  type: TypeRulesNames,
  operation: O
): O extends "importFromEnterprise"
  ? ImportFromEnterpriseFunction | undefined
  : O extends "exportToEnterprise"
    ? ExportToEnterpriseFunction | undefined
    : O extends "exportToXML"
      ? ExportToXMLFunction | undefined
      : ImportExportFunction | undefined => {
  const key = createRegistryKey(type, operation)
  const result = typeRulesRegistry.get(key)
  return result as any
}

export const clearTypeRulesRegistry = (): void => {
  typeRulesRegistry.clear()
}
