import { TSchema } from "@sinclair/typebox"
import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { Border, BorderEnterprise, BorderYAML } from "~/metadata/commonObjects/border/types"
import { Color, ColorEnterprise, ColorYAML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { DataPathYAML } from "~/metadata/commonObjects/metadataPath/types"
import { Picture, PictureEnterprise, PictureYAML } from "~/metadata/commonObjects/picture/types"
import {
  TypeDescription,
  TypeDescriptionEnterprise,
  TypeDescriptionYAML,
} from "~/metadata/commonObjects/typeDescription/types"
import { UserVisible, UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { AllChildItemsEnterprise } from "~/metadata/forms/commonObjects/childItems/types"
import { DataPath } from "~/metadata/forms/commonObjects/dataPath/types"
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
  | "DataPath"
  | "CommandName"

export type ExportToXMLFunction = (context: ConfigurationContext, rule: PropertyRule, value: any) => any | undefined

export type ExportToXMLFunctionNew = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  rule: PropertyRule
  metadataItem?: T
  value: any
}) => any | undefined

export type ImportFromXMLFunction = (context: ConfigurationContext, rule: PropertyRule, value: any) => any | undefined

export type ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  yaml?: any
  source?: any
  value: any
  name?: string
}) => any | undefined

export type ImportFromYAMLFunction = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: any | undefined,
  source?: any
) => any | undefined

export type ExportToYAMLFunction = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: any | undefined
) => any | undefined

export type ExportToYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any
  name?: string
}) => any | undefined

export type ExportToEnterpriseFunction = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any | undefined
}) => any | undefined

export type ExportToJSONSchemaFn = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any | undefined
}) => TSchema | undefined

export interface TypeRule {
  importFromXML?: ImportFromXMLFunction
  exportToXML?: ExportToXMLFunction | ExportToXMLFunctionNew
  importFromYAML?: ImportFromYAMLFunction | ImportFromYAMLFunctionNew
  exportToYAML?: ExportToYAMLFunction | ExportToYAMLFunctionNew
  exportToEnterprise?: ExportToEnterpriseFunction
  exportToJSONSchema?: ExportToJSONSchemaFn
}

export type TypeRulesOperations =
  | "importFromXML"
  | "exportToXML"
  | "importFromYAML"
  | "exportToYAML"
  | "exportToEnterprise"
  | "exportToJSONSchema"
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
          : O extends "exportToJSONSchema"
            ? ExportToJSONSchemaFn | undefined
            : never

const TypesNamesList = [
  "number",
  "string",
  "boolean",
  "SystemEnumeration",
  "Color",
  "TypeDescription",
  "DataPath",
  "I8nText",
  "Font",
  "ChildItems",
  "Picture",
  "Border",
  "CommandName",
  "UserVisible",
] as const

type TypesMap =
  | ["number", number, number, number]
  | ["string", string, string, string]
  | ["boolean", boolean, boolean, StringboolYAML]
  | ["SystemEnumeration", unknown, SystemEnumerationEnterprise, unknown]
  | ["Color", Color, ColorEnterprise, ColorYAML]
  | ["TypeDescription", TypeDescription, TypeDescriptionEnterprise, TypeDescriptionYAML]
  | ["DataPath", DataPath, string, DataPathYAML]
  | ["I8nText", I8nText, string, I8nTextYAML]
  | ["Font", Font, FontEnterprise, FontYAML]
  | ["ChildItems", unknown, AllChildItemsEnterprise, unknown]
  | ["Picture", Picture, PictureEnterprise, PictureYAML]
  | ["Border", Border, BorderEnterprise, BorderYAML]
  | ["CommandName", string, string, string]
  | ["UserVisible", UserVisible, unknown, UserVisibleYAML]

export type TypeRulesNamesNew = (typeof TypesNamesList)[number]

export type EnterpriseTypeByKey<Key extends TypeRulesNamesNew> = Extract<TypesMap, [Key, any, any, any]>[2]

export type YAMLTypeByKey<Key extends TypeRulesNamesNew> = Extract<TypesMap, [Key, any, any, any]>[3]

export const TypesNames = TypesNamesList

export type ElementTypeByKey<Key extends TypeRulesNamesNew> = Extract<TypesMap, [Key, any, any, any]>[1]
