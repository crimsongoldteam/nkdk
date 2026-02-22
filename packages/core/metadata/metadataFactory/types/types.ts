import { ColorEnterprise } from "~/metadata/commonObjects/color/types"
import { TypeDescriptionEnterprise } from "~/metadata/commonObjects/typeDescription/types"
import { SystemEnumerationEnterprise } from "~/metadata/systemEnumerations/types"
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
  | "AdditionalIndex"
  | "MetadataAttributes"
  | "StandardAttributeDescription"
  | "MetadataItemLinks"
  | "MetadataCommands"
  | "CharacteristicsDescription"
  | "MetadataTabularSections"

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

export type ImportFromYAMLFunction = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  value: any | undefined,
  source?: any
) => any | undefined

export type ExportToYAMLFunction = (
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

export type ExportToEnterpriseFunction = (params: {
  context: ConfigurationContext
  rule: PropertyRule<any>
  value: any | undefined
}) => any | undefined

export interface TypeRule {
  importFromXML?: ImportFromXMLFunction
  exportToXML?: ExportToXMLFunction | ExportToXMLFunctionNew
  importFromYAML?: ImportFromYAMLFunction | ImportFromYAMLFunctionNew
  exportToYAML?: ExportToYAMLFunction | ExportToYAMLFunctionNew
  exportToEnterprise?: ExportToEnterpriseFunction
}

export type TypeRulesOperations =
  | "importFromXML"
  | "exportToXML"
  | "importFromYAML"
  | "exportToYAML"
  | "exportToEnterprise"

type TypeRuleKey = `${TypeRulesNames}:${TypeRulesOperations}`

export const createRegistryKey = (type: TypeRulesNames, operation: TypeRulesOperations): TypeRuleKey => {
  return `${type}:${operation}`
}

export type ImportExportFunction<O extends TypeRulesOperations> = O extends "importFromYAML"
  ? ImportFromYAMLFunctionNew | ImportFromYAMLFunction | undefined
  : O extends "exportToYAML"
    ? ExportToYAMLFunction | ExportToYAMLFunctionNew | undefined
    : O extends "exportToXML"
      ? ExportToXMLFunction | ExportToXMLFunctionNew | undefined
      : O extends "importFromXML"
        ? ImportFromXMLFunction | undefined
        : O extends "exportToEnterprise"
          ? ExportToEnterpriseFunction | undefined
          : never

type TypesMap =
  | ["number", number, number]
  | ["string", string, string]
  | ["boolean", boolean, boolean]
  | ["SystemEnumeration", unknown, SystemEnumerationEnterprise]
  | ["Color", unknown, ColorEnterprise]
  | ["TypeDescription", unknown, TypeDescriptionEnterprise]

export type TypeRulesNamesNew = TypesMap extends [infer First, any, any] ? First : never
export type EnterpriseTypeByKey<Key extends TypeRulesNamesNew> = Extract<TypesMap, [Key, any, any]>[2]

export type d = EnterpriseTypeByKey<"TypeDescription">
