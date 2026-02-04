import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "../metadataFactory/rulesFactory"
import { exportSystemEnumerationToYAML } from "../systemEnumerations/exportToEnterprise"
import { exportSystemEnumerationToPreview } from "../systemEnumerations/exportToPreview"
import { importSystemEnumerationFromYAML } from "../systemEnumerations/importFromEnterprise"
import { exportBooleanToEnterprise } from "./boolean/exportToEnterprise"
import { importBooleanFromXML } from "./boolean/importFromXML"
import { exportBorderToEnterprise } from "./border/exportToEnterprise"
import { exportBorderToXML } from "./border/exportToXML"
import { importBorderFromEnterprise } from "./border/importFromEnterprise"
import { importBorderFromXML } from "./border/importFromXML"
import { exportColorToEnterprise } from "./color/exportToEnterprise"
import { exportColorToXML } from "./color/exportToXML"
import { importColorFromEnterprise } from "./color/importFromEnterprise"
import { importColorFromXML } from "./color/importFromXML"
import { exportDynamicListToEnterprise } from "./dynamicList/exportToEnterprise"
import { exportDynamicListToXML } from "./dynamicList/exportToXML"
import { exportFieldsListToEnterprise } from "./fieldsList/exportToEnterprise"
import { exportFieldsListToXML } from "./fieldsList/exportToXML"
import { importFieldsListFromXML } from "./fieldsList/importFromXML"
import { exportFontToEnterprise } from "./font/exportToEnterprise"
import { exportFontToPreview } from "./font/exportToPreview"
import { importFontFromEnterprise } from "./font/importFromEnterprise"
import { importFontFromXML } from "./font/importFromXML"
import { exportFontToXML } from "./font/exportToXML"
import { exportFormattedI8nTextToEnterprise } from "./formattedI8nText/exportToEnterprise"
import { exportFormattedI8nTextToXML } from "./formattedI8nText/exportToXML"
import { importFormattedI8nTextFromEnterprise } from "./formattedI8nText/importFromEnterprise"
import { importFormattedI8nTextFromXML } from "./formattedI8nText/importFromXML"
import { exportFormParametersToEnterprise } from "./formParameter/exportToEnterprise"
import { importFormParametersFromEnterprise } from "./formParameter/importFromEnterprise"
import { importFormParametersFromXML } from "./formParameter/importFromXML"
import { exportFormParametersToXML } from "./formParameter/exportToXML"
import { exportFunctionalOptionsToEnterprise } from "./functionalOptionsProperty/exportToEnterprise"
import { importFunctionalOptionsFromEnterprise } from "./functionalOptionsProperty/importFromEnterprise"
import { importFunctionalOptionsFromXML } from "./functionalOptionsProperty/importFromXML"
import { exportFunctionalOptionsToXML } from "./functionalOptionsProperty/exportToXML"
import { exportI8nTextToEnterprise } from "./i8nText/exportToEnterprise"
import { exportI8nTextToPreview } from "./i8nText/exportToPreview"
import { importI8nTextFromEnterprise } from "./i8nText/importFromEnterprise"
import { importI8nTextFromXML } from "./i8nText/importFromXML"
import { exportI8nTextToXML } from "./i8nText/exportToXML"
import { exportIndexFieldToEnterprise } from "./indexField/exportToEnterprise"
import { importIndexFieldFromEnterprise } from "./indexField/importFromEnterprise"
import { importIndexFieldFromXML } from "./indexField/importFromXML"
import { exportIndexFieldToXML } from "./indexField/exportToXML"
import { exportMetadataFieldToEnterprise } from "./metadataField/exportToEnterprise"
import { importMetadataFieldFromEnterprise } from "./metadataField/importFromEnterprise"
import { importMetadataFieldFromXML } from "./metadataField/importFromXML"
import { exportMetadataFieldToXML } from "./metadataField/exportToXML"
import { exportMetadataValueToEnterprise } from "./metadataValue/exportToEnterprise"
import { importMetadataValueFromEnterprise } from "./metadataValue/importFromEnterprise"
import { importMetadataValueFromXML } from "./metadataValue/importFromXML"
import { exportMetadataValueToXML } from "./metadataValue/exportToXML"
import { importMetadataValueCollectionFromEnterprise } from "./metadataValueCollection/importFromEnterprise"
import { importMetadataValueCollectionFromXML } from "./metadataValueCollection/importFromXML"
import { exportMetadataValueCollectionToXML } from "./metadataValueCollection/exportToXML"
import { exportPictureToEnterprise } from "./picture/exportToEnterprise"
import { exportPictureToXML } from "./picture/exportToXML"
import { exportPredefinedToEnterprise } from "./predifined/exportToEnterprise"
import { importPredefinedFromEnterprise } from "./predifined/importFromEnterprise"
import { importPredefinedFromXML } from "./predifined/importFromXML"
import { exportPredefinedToXML } from "./predifined/exportToXML"
import { exportTypeDescriptionToEnterprise } from "./typeDescription/exportToEnterprise"
import { exportTypeDescriptionToXML } from "./typeDescription/exportToXML"
import { exportTypeLinkToEnterprise } from "./typeLink/exportToEnterprise"
import { importTypeLinkFromEnterprise } from "./typeLink/importFromEnterprise"
import { importTypeLinkFromXML } from "./typeLink/importFromXML"
import { exportTypeLinkToXML } from "./typeLink/exportToXML"
import { exportUsePurposesToEnterprise } from "./usePurposes/exportToEnterprise"
import { importUsePurposesFromEnterprise } from "./usePurposes/importFromEnterprise"
import { importUsePurposesFromXML } from "./usePurposes/importFromXML"
import { exportUsePurposesToXML } from "./usePurposes/exportToXML"
import { exportUserVisibleToEnterprise } from "./userVisible/exportToEnterprise"
import { importUserVisibleFromEnterprise } from "./userVisible/importFromEnterprise"
import { importUserVisibleFromXML } from "./userVisible/importFromXML"
import { exportUserVisibleToXML } from "./userVisible/exportToXML"
import { exportChoiceParametersToEnterprise } from "./сhoiceParameters/exportToEnterprise"
import { importChoiceParametersFromEnterprise } from "./сhoiceParameters/importFromEnterprise"
import { importChoiceParametersFromXML } from "./сhoiceParameters/importFromXML"
import { exportChoiceParametersToXML } from "./сhoiceParameters/exportToXML"

export interface TypeRule {
  importFromXML?: (...args: any[]) => any
  exportToXML?: (...args: any[]) => any
  importFromEnterprise?: (...args: any[]) => any
  exportToEnterprise?: (...args: any[]) => any
  exportToPreview?: (...args: any[]) => any
}

export const importPropertyFromXML = (context: ConfigurationContext, propertyRule: PropertyRule, data: any): any => {
  const typeRule = TypeRules[propertyRule.type]

  if (typeRule === undefined) return data

  if (typeRule.importFromXML === undefined) return data

  const result = typeRule.importFromXML(context, propertyRule, data)

  return result
}

export const TypeRules: Record<string, TypeRule> = {
  boolean: {
    importFromXML: importBooleanFromXML,
    exportToEnterprise: exportBooleanToEnterprise,
    importFromEnterprise: exportBooleanToEnterprise,
  },

  Border: {
    importFromXML: importBorderFromXML,
    importFromEnterprise: importBorderFromEnterprise,
    exportToXML: exportBorderToXML,
    exportToEnterprise: exportBorderToEnterprise,
  },

  Color: {
    importFromXML: importColorFromXML,
    importFromEnterprise: importColorFromEnterprise,
    exportToXML: exportColorToXML,
    exportToEnterprise: exportColorToEnterprise,
  },

  DynamicList: {
    exportToXML: exportDynamicListToXML,
    exportToEnterprise: exportDynamicListToEnterprise,
  },

  FieldsList: {
    importFromXML: importFieldsListFromXML,
    importFromEnterprise: importBorderFromEnterprise,
    exportToXML: exportFieldsListToXML,
    exportToEnterprise: exportFieldsListToEnterprise,
  },

  Font: {
    importFromXML: importFontFromXML,
    importFromEnterprise: importFontFromEnterprise,
    exportToXML: exportFontToXML,
    exportToEnterprise: exportFontToEnterprise,
    exportToPreview: exportFontToPreview,
  },

  FormattedI8nText: {
    importFromXML: importFormattedI8nTextFromXML,
    importFromEnterprise: importFormattedI8nTextFromEnterprise,
    exportToXML: exportFormattedI8nTextToXML,
    exportToEnterprise: exportFormattedI8nTextToEnterprise,
  },

  FormParameter: {
    importFromXML: importFormParametersFromXML,
    importFromEnterprise: importFormParametersFromEnterprise,
    exportToXML: exportFormParametersToXML,
    exportToEnterprise: exportFormParametersToEnterprise,
  },

  FunctionalOptionsProperty: {
    importFromXML: importFunctionalOptionsFromXML,
    importFromEnterprise: importFunctionalOptionsFromEnterprise,
    exportToXML: exportFunctionalOptionsToXML,
    exportToEnterprise: exportFunctionalOptionsToEnterprise,
  },

  I8nText: {
    importFromXML: importI8nTextFromXML,
    importFromEnterprise: importI8nTextFromEnterprise,
    exportToXML: exportI8nTextToXML,
    exportToEnterprise: exportI8nTextToEnterprise,
    exportToPreview: exportI8nTextToPreview,
  },

  IndexField: {
    importFromXML: importIndexFieldFromXML,
    importFromEnterprise: importIndexFieldFromEnterprise,
    exportToXML: exportIndexFieldToXML,
    exportToEnterprise: exportIndexFieldToEnterprise,
  },

  MetadataField: {
    importFromXML: importMetadataFieldFromXML,
    importFromEnterprise: importMetadataFieldFromEnterprise,
    exportToXML: exportMetadataFieldToXML,
    exportToEnterprise: exportMetadataFieldToEnterprise,
  },

  MetadataValue: {
    importFromXML: importMetadataValueFromXML,
    importFromEnterprise: importMetadataValueFromEnterprise,
    exportToXML: exportMetadataValueToXML,
    exportToEnterprise: exportMetadataValueToEnterprise,
  },

  MetadataValueCollection: {
    importFromXML: importMetadataValueCollectionFromXML,
    importFromEnterprise: importMetadataValueCollectionFromEnterprise,
    exportToXML: exportMetadataValueCollectionToXML,
  },

  Picture: {
    exportToXML: exportPictureToXML,
    exportToEnterprise: exportPictureToEnterprise,
  },

  Predefined: {
    importFromXML: importPredefinedFromXML,
    importFromEnterprise: importPredefinedFromEnterprise,
    exportToXML: exportPredefinedToXML,
    exportToEnterprise: exportPredefinedToEnterprise,
  },

  TypeLink: {
    importFromXML: importTypeLinkFromXML,
    importFromEnterprise: importTypeLinkFromEnterprise,
    exportToXML: exportTypeLinkToXML,
    exportToEnterprise: exportTypeLinkToEnterprise,
  },

  TypeDescription: {
    exportToXML: exportTypeDescriptionToXML,
    exportToEnterprise: exportTypeDescriptionToEnterprise,
  },

  UsePurposes: {
    importFromXML: importUsePurposesFromXML,
    importFromEnterprise: importUsePurposesFromEnterprise,
    exportToXML: exportUsePurposesToXML,
    exportToEnterprise: exportUsePurposesToEnterprise,
  },

  UserVisible: {
    importFromXML: importUserVisibleFromXML,
    importFromEnterprise: importUserVisibleFromEnterprise,
    exportToXML: exportUserVisibleToXML,
    exportToEnterprise: exportUserVisibleToEnterprise,
  },

  ChoiceParameters: {
    importFromXML: importChoiceParametersFromXML,
    importFromEnterprise: importChoiceParametersFromEnterprise,
    exportToXML: exportChoiceParametersToXML,
    exportToEnterprise: exportChoiceParametersToEnterprise,
  },

  SystemEnumeration: {
    importFromEnterprise: importSystemEnumerationFromYAML,
    exportToEnterprise: exportSystemEnumerationToYAML,
    exportToPreview: exportSystemEnumerationToPreview,
  },
}
