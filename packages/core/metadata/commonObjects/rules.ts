import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "../forms/elements/calendarField/rules"
import { exportSystemEnumerationToYAML } from "../systemEnumerations/exportToEnterprise"
import { exportSystemEnumerationToPreview } from "../systemEnumerations/exportToPreview"
import { importSystemEnumerationFromYAML } from "../systemEnumerations/importFromEnterprise"
import { exportBooleanToYAML } from "./boolean/exportToYAML"
import { importBooleanFromXML } from "./boolean/importFromXML"
import { importBooleanFromYAML } from "./boolean/importFromYAML"
import { exportBorderToYAML } from "./border/exportToYAML"
import { exportBorderToXML } from "./border/exportToXML"
import { importBorderFromEnterprise } from "./border/importFromEnterprise"
import { importBorderFromXML } from "./border/importFromXML"
import { exportColorToYAML } from "./color/exportToYAML"
import { exportColorToXML } from "./color/exportToXML"
import { importColorFromEnterprise } from "./color/importFromEnterprise"
import { importColorFromXML } from "./color/importFromXML"
import { exportDynamicListToYAML } from "./dynamicList/exportToYAML"
import { exportDynamicListToXML } from "./dynamicList/exportToXML"
import { exportFieldsListToYAML } from "./fieldsList/exportToYAML"
import { exportFieldsListToXML } from "./fieldsList/exportToXML"
import { importFieldsListFromEnterprise } from "./fieldsList/importFromEnterprise"
import { importFieldsListFromXML } from "./fieldsList/importFromXML"
import { exportFontToYAML } from "./font/exportToYAML"
import { exportFontToPreview } from "./font/exportToPreview"
import { exportFontToXML } from "./font/exportToXML"
import { importFontFromEnterprise } from "./font/importFromEnterprise"
import { importFontFromXML } from "./font/importFromXML"
import { exportFormattedI8nTextToYAML } from "./formattedI8nText/exportToYAML"
import { exportFormattedI8nTextToXML } from "./formattedI8nText/exportToXML"
import { importFormattedI8nTextFromEnterprise } from "./formattedI8nText/importFromEnterprise"
import { importFormattedI8nTextFromXML } from "./formattedI8nText/importFromXML"
import { exportFormParametersToYAML } from "./formParameter/exportToYAML"
import { exportFormParametersToXML } from "./formParameter/exportToXML"
import { importFormParametersFromEnterprise } from "./formParameter/importFromEnterprise"
import { importFormParametersFromXML } from "./formParameter/importFromXML"
import { exportFunctionalOptionsToYAML } from "./functionalOptionsProperty/exportToYAML"
import { exportFunctionalOptionsToXML } from "./functionalOptionsProperty/exportToXML"
import { importFunctionalOptionsFromEnterprise } from "./functionalOptionsProperty/importFromEnterprise"
import { importFunctionalOptionsFromXML } from "./functionalOptionsProperty/importFromXML"
import { exportI8nTextToYAML } from "./i8nText/exportToYAML"
import { exportI8nTextToPreview } from "./i8nText/exportToPreview"
import { exportI8nTextToXML } from "./i8nText/exportToXML"
import { importI8nTextFromEnterprise } from "./i8nText/importFromEnterprise"
import { importI8nTextFromXML } from "./i8nText/importFromXML"
import { exportIndexFieldToYAML } from "./indexField/exportToYAML"
import { exportIndexFieldToXML } from "./indexField/exportToXML"
import { importIndexFieldFromEnterprise } from "./indexField/importFromEnterprise"
import { importIndexFieldFromXML } from "./indexField/importFromXML"
import { exportMetadataFieldToYAML } from "./metadataField/exportToYAML"
import { exportMetadataFieldToXML } from "./metadataField/exportToXML"
import { importMetadataFieldFromEnterprise } from "./metadataField/importFromEnterprise"
import { importMetadataFieldFromXML } from "./metadataField/importFromXML"
import { exportMetadataValueToYAML } from "./metadataValue/exportToYAML"
import { exportMetadataValueToXML } from "./metadataValue/exportToXML"
import { importMetadataValueFromEnterprise } from "./metadataValue/importFromEnterprise"
import { importMetadataValueFromXML } from "./metadataValue/importFromXML"
import { exportMetadataValueCollectionToXML } from "./metadataValueCollection/exportToXML"
import { importMetadataValueCollectionFromEnterprise } from "./metadataValueCollection/importFromEnterprise"
import { importMetadataValueCollectionFromXML } from "./metadataValueCollection/importFromXML"
import { exportPictureToYAML } from "./picture/exportToYAML"
import { exportPictureToXML } from "./picture/exportToXML"
import { exportPredefinedToYAML } from "./predifined/exportToYAML"
import { exportPredefinedToXML } from "./predifined/exportToXML"
import { importPredefinedFromEnterprise } from "./predifined/importFromEnterprise"
import { importPredefinedFromXML } from "./predifined/importFromXML"
import { exportTypeDescriptionToYAML } from "./typeDescription/exportToYAML"
import { exportTypeDescriptionToXML } from "./typeDescription/exportToXML"
import { exportTypeLinkToYAML } from "./typeLink/exportToYAML"
import { exportTypeLinkToXML } from "./typeLink/exportToXML"
import { importTypeLinkFromEnterprise } from "./typeLink/importFromEnterprise"
import { importTypeLinkFromXML } from "./typeLink/importFromXML"
import { exportUsePurposesToYAML } from "./usePurposes/exportToYAML"
import { exportUsePurposesToXML } from "./usePurposes/exportToXML"
import { importUsePurposesFromEnterprise } from "./usePurposes/importFromEnterprise"
import { importUsePurposesFromXML } from "./usePurposes/importFromXML"
import { exportUserVisibleToYAML } from "./userVisible/exportToYAML"
import { exportUserVisibleToXML } from "./userVisible/exportToXML"
import { importUserVisibleFromEnterprise } from "./userVisible/importFromEnterprise"
import { importUserVisibleFromXML } from "./userVisible/importFromXML"
import { exportChoiceParametersToYAML } from "./сhoiceParameters/exportToYAML"
import { exportChoiceParametersToXML } from "./сhoiceParameters/exportToXML"
import { importChoiceParametersFromEnterprise } from "./сhoiceParameters/importFromEnterprise"
import { importChoiceParametersFromXML } from "./сhoiceParameters/importFromXML"

interface TypeRule {
  importFromXML?: (
    context: ConfigurationContext,
    rule: PropertyRule,
    data: any | undefined,
    ...args: any[]
  ) => any | undefined
  exportToXML?: (context: ConfigurationContext, data: any, rule?: PropertyRule) => any
  importFromYAML?: (context: ConfigurationContext, rule: PropertyRule, data: any) => any
  exportToYAML?: (context: ConfigurationContext, rule: PropertyRule, data: any) => any
  exportToPreview?: (context: ConfigurationContext, rule: PropertyRule, data: any) => any
}

export const TypeRules: Record<string, TypeRule[]> = {
  boolean: [
    {
      importFromXML: importBooleanFromXML,
      importFromYAML: importBooleanFromYAML,
      exportToYAML: exportBooleanToYAML,
    },
  ],
  Border: [
    {
      importFromXML: importBorderFromXML,
      importFromYAML: importBorderFromEnterprise,
      exportToXML: exportBorderToXML,
      exportToYAML: exportBorderToYAML,
    },
  ],
  Color: [
    {
      importFromXML: importColorFromXML,
      importFromYAML: importColorFromEnterprise,
      exportToXML: exportColorToXML,
      exportToYAML: exportColorToYAML,
    },
  ],
  DynamicList: [
    {
      exportToXML: exportDynamicListToXML,
      exportToYAML: exportDynamicListToYAML,
    },
  ],
  FieldsList: [
    {
      importFromXML: importFieldsListFromXML,
      importFromYAML: importFieldsListFromEnterprise,
      exportToXML: exportFieldsListToXML,
      exportToYAML: exportFieldsListToYAML,
    },
  ],
  Font: [
    {
      importFromXML: importFontFromXML,
      importFromYAML: importFontFromEnterprise,
      exportToXML: exportFontToXML,
      exportToYAML: exportFontToEnterprise,
      exportToPreview: exportFontToPreview,
    },
  ],
  FormattedI8nText: [
    {
      importFromXML: importFormattedI8nTextFromXML,
      importFromYAML: importFormattedI8nTextFromEnterprise,
      exportToXML: exportFormattedI8nTextToXML,
      exportToYAML: exportFormattedI8nTextToYAML,
    },
  ],
  FormParameter: [
    {
      importFromXML: importFormParametersFromXML,
      importFromYAML: importFormParametersFromEnterprise,
      exportToXML: exportFormParametersToXML,
      exportToYAML: exportFormParametersToYAML,
    },
  ],
  FunctionalOptionsProperty: [
    {
      importFromXML: importFunctionalOptionsFromXML,
      importFromYAML: importFunctionalOptionsFromEnterprise,
      exportToXML: exportFunctionalOptionsToXML,
      exportToYAML: exportFunctionalOptionsToYAML,
    },
  ],
  I8nText: [
    {
      importFromXML: importI8nTextFromXML,
      importFromYAML: importI8nTextFromEnterprise,
      exportToXML: exportI8nTextToXML,
      exportToYAML: exportI8nTextToEnterprise,
      exportToPreview: exportI8nTextToPreview,
    },
  ],
  IndexField: [
    {
      importFromXML: importIndexFieldFromXML,
      importFromYAML: importIndexFieldFromEnterprise,
      exportToXML: exportIndexFieldToXML,
      exportToYAML: exportIndexFieldToYAML,
    },
  ],
  MetadataField: [
    {
      importFromXML: importMetadataFieldFromXML,
      importFromYAML: importMetadataFieldFromEnterprise,
      exportToXML: exportMetadataFieldToXML,
      exportToYAML: exportMetadataFieldToYAML,
    },
  ],
  MetadataValue: [
    {
      importFromXML: importMetadataValueFromXML,
      importFromYAML: importMetadataValueFromEnterprise,
      exportToXML: exportMetadataValueToXML,
      exportToYAML: exportMetadataValueToYAML,
    },
  ],
  MetadataValueCollection: [
    {
      importFromXML: importMetadataValueCollectionFromXML,
      importFromYAML: importMetadataValueCollectionFromEnterprise,
      exportToXML: exportMetadataValueCollectionToXML,
    },
  ],
  Picture: [
    {
      exportToXML: exportPictureToXML,
      exportToYAML: exportPictureToYAML,
    },
  ],
  Predefined: [
    {
      importFromXML: importPredefinedFromXML,
      importFromYAML: importPredefinedFromEnterprise,
      exportToXML: exportPredefinedToXML,
      exportToYAML: exportPredefinedToYAML,
    },
  ],
  TypeLink: [
    {
      importFromXML: importTypeLinkFromXML,
      importFromYAML: importTypeLinkFromEnterprise,
      exportToXML: exportTypeLinkToXML,
      exportToYAML: exportTypeLinkToYAML,
    },
  ],
  TypeDescription: [
    {
      exportToXML: exportTypeDescriptionToXML,
      exportToYAML: exportTypeDescriptionToYAML,
    },
  ],
  UsePurposes: [
    {
      importFromXML: importUsePurposesFromXML,
      importFromYAML: importUsePurposesFromEnterprise,
      exportToXML: exportUsePurposesToXML,
      exportToYAML: exportUsePurposesToYAML,
    },
  ],
  UserVisible: [
    {
      importFromXML: importUserVisibleFromXML,
      importFromYAML: importUserVisibleFromEnterprise,
      exportToXML: exportUserVisibleToXML,
      exportToYAML: exportUserVisibleToYAML,
    },
  ],
  ChoiceParameters: [
    {
      importFromXML: importChoiceParametersFromXML,
      importFromYAML: importChoiceParametersFromEnterprise,
      exportToXML: exportChoiceParametersToXML,
      exportToYAML: exportChoiceParametersToYAML,
    },
  ],
  SystemEnumeration: [
    {
      importFromYAML: importSystemEnumerationFromYAML,
      exportToYAML: exportSystemEnumerationToYAML,
      exportToPreview: exportSystemEnumerationToPreview,
    },
  ],
}
