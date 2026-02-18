import { ConfigurationContext } from "../../context/types"
import { MetadataItem, PropertyRule } from "../properties/types"

export type TypeRulesNames =
  | "AssociatedTable"
  | "AutoCommandBar"
  | "TableAutoCommandBar"
  | "ChildItems"
  | "ChoiceParameterLinks"
  | "boolean"
  | "string"
  | "number"
  | "Border"
  | "Color"
  | "ExtendedTooltip"
  | "ContextMenu"
  | "DynamicList"
  | "ChoiceList"
  | "CommandSet"
  | "Commands"
  | "CommandInterface"
  | "FormCommands"
  | "FieldsList"
  | "Font"
  | "FormattedI8nText"
  | "FormParameters"
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
  | "ViewStatusAddition"
  | "SearchStringAddition"
  | "SearchControlAddition"
  | "TableAdditionalSource"
  | "FormAttributeColumns"
  // | "FormAttributeAdditionalColumns"
  | "FormAttributes"
  | "FormAttributeSettings"

export type ExportToXMLFunction = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  value: any
) => any | undefined

export type ExportToXMLFunctionNew = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  rule: PropertyRule<T>
  metadataItem?: T
  value: any
}) => any | undefined

export type ImportFromXMLFunction = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  value: any
) => any | undefined

export type ImportFromYAMLFunctionNew = <T extends MetadataItem | never = never>(params: {
  context: ConfigurationContext
  rule: PropertyRule<T>
  yaml?: any
  source?: any
  value: any
  name?: string
}) => any | undefined

export type ImportFromEnterpriseFunction = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  value: any | undefined,
  source?: any
) => any | undefined

export type ExportToEnterpriseFunction = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  value: any | undefined
) => any | undefined

export type ExportToYAMLFunctionNew = <T extends MetadataItem | never = never>(params: {
  context: ConfigurationContext
  rule: PropertyRule<T>
  value: any
  name?: string
}) => any | undefined

export type ExportToPreviewFunction = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  value: any | undefined
) => any | undefined

export interface TypeRule {
  importFromXML?: ImportFromXMLFunction
  exportToXML?: ExportToXMLFunction | ExportToXMLFunctionNew
  importFromEnterprise?: ImportFromEnterpriseFunction | ImportFromYAMLFunctionNew
  exportToEnterprise?: ExportToEnterpriseFunction | ExportToYAMLFunctionNew
  exportToPreview?: ExportToPreviewFunction
}

export type TypeRulesOperations =
  | "importFromXML"
  | "exportToXML"
  | "importFromEnterprise"
  | "exportToEnterprise"
  | "exportToPreview"

type TypeRuleKey = `${TypeRulesNames}:${TypeRulesOperations}`

export const createRegistryKey = (type: TypeRulesNames, operation: TypeRulesOperations): TypeRuleKey => {
  return `${type}:${operation}`
}

export type ImportExportFunction<O extends TypeRulesOperations> = O extends "importFromEnterprise"
  ? ImportFromYAMLFunctionNew | ImportFromEnterpriseFunction | undefined
  : O extends "exportToEnterprise"
    ? ExportToEnterpriseFunction | ExportToYAMLFunctionNew | undefined
    : O extends "exportToXML"
      ? ExportToXMLFunction | ExportToXMLFunctionNew | undefined
      : O extends "importFromXML"
        ? ImportFromXMLFunction | undefined
        : O extends "exportToPreview"
          ? ExportToPreviewFunction | undefined
          : never
