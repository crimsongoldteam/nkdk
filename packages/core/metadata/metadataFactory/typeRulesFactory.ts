import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "./properties/types"

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
  | "FormAttributeAdditionalColumns"
  | "FormAttributes"

type ExportToXMLFunction = (context: ConfigurationContext, rule: PropertyRule<any>, value: any) => any | undefined

type ImportFromXMLFunction = (context: ConfigurationContext, rule: PropertyRule<any>, value: any) => any | undefined

type ImportFromEnterpriseFunction = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  value: any | undefined,
  source?: any
) => any | undefined

type ExportToEnterpriseFunction = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  value: any | undefined
) => any | undefined

type ExportToPreviewFunction = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  value: any | undefined
) => any | undefined

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
  | ImportFromEnterpriseFunction
  | ExportToEnterpriseFunction
  | ImportFromXMLFunction
  | ExportToXMLFunction
  | ExportToPreviewFunction
>()

type TypeRuleKey = `${TypeRulesNames}:${TypeRulesOperations}`

const createRegistryKey = (type: TypeRulesNames, operation: TypeRulesOperations): TypeRuleKey => {
  return `${type}:${operation}`
}

type ImportExportFunction<O extends TypeRulesOperations> = O extends "importFromEnterprise"
  ? ImportFromEnterpriseFunction | undefined
  : O extends "exportToEnterprise"
    ? ExportToEnterpriseFunction | undefined
    : O extends "exportToXML"
      ? ExportToXMLFunction | undefined
      : O extends "importFromXML"
        ? ImportFromXMLFunction | undefined
        : O extends "exportToPreview"
          ? ExportToPreviewFunction | undefined
          : never

export const registerTypeRule = <O extends TypeRulesOperations>(
  type: TypeRulesNames,
  operation: O,
  ruleFunction: NonNullable<ImportExportFunction<O>>
) => {
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
      : O extends "importFromXML"
        ? ImportFromXMLFunction | undefined
        : O extends "exportToPreview"
          ? ExportToPreviewFunction | undefined
          : never => {
  const key = createRegistryKey(type, operation)
  const result = typeRulesRegistry.get(key)
  return result as any
}

export const clearTypeRulesRegistry = (): void => {
  typeRulesRegistry.clear()
}
