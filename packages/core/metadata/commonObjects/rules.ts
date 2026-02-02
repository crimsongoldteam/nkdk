import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "../forms/elements/calendarField/rules"
import { exportSystemEnumerationToYAML } from "../systemEnumerations/exportToEnterprise"
import { exportSystemEnumerationToPreview } from "../systemEnumerations/exportToPreview"
import { importSystemEnumerationFromYAML } from "../systemEnumerations/importFromEnterprise"
import { _importBooleanFromXML } from "./boolean/_importFromXML"
import { exportBooleanToYAML } from "./boolean/exportToYAML"
import { exportBorderToXML } from "./border/exportToXML"
import { exportBorderToYAML } from "./border/exportToYAML"
import { importBorderFromXML } from "./border/importFromXML"
import { importBorderFromYAML } from "./border/importFromYAML"
import { exportColorToXML } from "./color/exportToXML"
import { exportColorToYAML } from "./color/exportToYAML"
import { importColorFromXML } from "./color/importFromXML"
import { importColorFromYAML } from "./color/importFromYAML"
import { exportDynamicListToXML } from "./dynamicList/exportToXML"
import { exportDynamicListToYAML } from "./dynamicList/exportToYAML"
import { exportFieldsListToXML } from "./fieldsList/exportToXML"
import { exportFieldsListToYAML } from "./fieldsList/exportToYAML"
import { importFieldsListFromXML } from "./fieldsList/importFromXML"
import { exportFontToEnterprise } from "./font/exportToEnterprise"
import { exportFontToPreview } from "./font/exportToPreview"
import { exportFontToXML } from "./font/exportToXML"
import { importFontFromXML } from "./font/importFromXML"
import { importFontFromYAML } from "./font/importFromYAML"
import { exportFormattedI8nTextToXML } from "./formattedI8nText/exportToXML"
import { exportFormattedI8nTextToYAML } from "./formattedI8nText/exportToYAML"
import { importFormattedI8nTextFromXML } from "./formattedI8nText/importFromXML"
import { importFormattedI8nTextFromYAML } from "./formattedI8nText/importFromYAML"
import { exportFormParametersToXML } from "./formParameter/exportToXML"
import { exportFormParametersToYAML } from "./formParameter/exportToYAML"
import { importFormParametersFromXML } from "./formParameter/importFromXML"
import { importFormParametersFromYAML } from "./formParameter/importFromYAML"
import { exportFunctionalOptionsToXML } from "./functionalOptionsProperty/exportToXML"
import { exportFunctionalOptionsToYAML } from "./functionalOptionsProperty/exportToYAML"
import { importFunctionalOptionsFromXML } from "./functionalOptionsProperty/importFromXML"
import { importFunctionalOptionsFromYAML } from "./functionalOptionsProperty/importFromYAML"
import { exportI8nTextToEnterprise } from "./i8nText/exportToEnterprise"
import { exportI8nTextToPreview } from "./i8nText/exportToPreview"
import { exportI8nTextToXML } from "./i8nText/exportToXML"
import { importI8nTextFromXML } from "./i8nText/importFromXML"
import { importI8nTextFromYAML } from "./i8nText/importFromYAML"
import { exportIndexFieldToXML } from "./indexField/exportToXML"
import { exportIndexFieldToYAML } from "./indexField/exportToYAML"
import { importIndexFieldFromXML } from "./indexField/importFromXML"
import { importIndexFieldFromYAML } from "./indexField/importFromYAML"
import { exportMetadataFieldToXML } from "./metadataField/exportToXML"
import { exportMetadataFieldToYAML } from "./metadataField/exportToYAML"
import { importMetadataFieldFromXML } from "./metadataField/importFromXML"
import { importMetadataFieldFromYAML } from "./metadataField/importFromYAML"
import { exportMetadataValueToXML } from "./metadataValue/exportToXML"
import { exportMetadataValueToYAML } from "./metadataValue/exportToYAML"
import { importMetadataValueFromXML } from "./metadataValue/importFromXML"
import { importMetadataValueFromYAML } from "./metadataValue/importFromYAML"
import { exportMetadataValueCollectionToXML } from "./metadataValueCollection/exportToXML"
import { importMetadataValueCollectionFromXML } from "./metadataValueCollection/importFromXML"
import { importMetadataValueCollectionFromYAML } from "./metadataValueCollection/importFromYAML"
import { exportPictureToXML } from "./picture/exportToXML"
import { exportPictureToYAML } from "./picture/exportToYAML"
import { exportPredefinedToXML } from "./predifined/exportToXML"
import { exportPredefinedToYAML } from "./predifined/exportToYAML"
import { importPredefinedFromXML } from "./predifined/importFromXML"
import { importPredefinedFromYAML } from "./predifined/importFromYAML"
import { exportTypeDescriptionToXML } from "./typeDescription/exportToXML"
import { exportTypeDescriptionToYAML } from "./typeDescription/exportToYAML"
import { exportTypeLinkToXML } from "./typeLink/exportToXML"
import { exportTypeLinkToYAML } from "./typeLink/exportToYAML"
import { importTypeLinkFromXML } from "./typeLink/importFromXML"
import { importTypeLinkFromYAML } from "./typeLink/importFromYAML"
import { exportUsePurposesToXML } from "./usePurposes/exportToXML"
import { exportUsePurposesToYAML } from "./usePurposes/exportToYAML"
import { importUsePurposesFromXML } from "./usePurposes/importFromXML"
import { importUsePurposesFromYAML } from "./usePurposes/importFromYAML"
import { exportUserVisibleToXML } from "./userVisible/exportToXML"
import { exportUserVisibleToYAML } from "./userVisible/exportToYAML"
import { importUserVisibleFromXML } from "./userVisible/importFromXML"
import { importUserVisibleFromYAML } from "./userVisible/importFromYAML"
import { exportChoiceParametersToXML } from "./сhoiceParameters/exportToXML"
import { exportChoiceParametersToYAML } from "./сhoiceParameters/exportToYAML"
import { importChoiceParametersFromXML } from "./сhoiceParameters/importFromXML"
import { importChoiceParametersFromYAML } from "./сhoiceParameters/importFromYAML"

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
      importFromXML: _importBooleanFromXML,
      importFromYAML: exportBooleanFromYAML,
      exportToYAML: exportBooleanToYAML,
    },
  ],
  Border: [
    {
      importFromXML: importBorderFromXML,
      importFromYAML: importBorderFromYAML,
      exportToXML: exportBorderToXML,
      exportToYAML: exportBorderToYAML,
    },
  ],
  Color: [
    {
      importFromXML: importColorFromXML,
      importFromYAML: importColorFromYAML,
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
      importFromYAML: exportFieldsListFromYAML,
      exportToXML: exportFieldsListToXML,
      exportToYAML: exportFieldsListToYAML,
    },
  ],
  Font: [
    {
      importFromXML: importFontFromXML,
      importFromYAML: importFontFromYAML,
      exportToXML: exportFontToXML,
      exportToYAML: exportFontToEnterprise,
      exportToPreview: exportFontToPreview,
    },
  ],
  FormattedI8nText: [
    {
      importFromXML: importFormattedI8nTextFromXML,
      importFromYAML: importFormattedI8nTextFromYAML,
      exportToXML: exportFormattedI8nTextToXML,
      exportToYAML: exportFormattedI8nTextToYAML,
    },
  ],
  FormParameter: [
    {
      importFromXML: importFormParametersFromXML,
      importFromYAML: importFormParametersFromYAML,
      exportToXML: exportFormParametersToXML,
      exportToYAML: exportFormParametersToYAML,
    },
  ],
  FunctionalOptionsProperty: [
    {
      importFromXML: importFunctionalOptionsFromXML,
      importFromYAML: importFunctionalOptionsFromYAML,
      exportToXML: exportFunctionalOptionsToXML,
      exportToYAML: exportFunctionalOptionsToYAML,
    },
  ],
  I8nText: [
    {
      importFromXML: importI8nTextFromXML,
      importFromYAML: importI8nTextFromYAML,
      exportToXML: exportI8nTextToXML,
      exportToYAML: exportI8nTextToEnterprise,
      exportToPreview: exportI8nTextToPreview,
    },
  ],
  IndexField: [
    {
      importFromXML: importIndexFieldFromXML,
      importFromYAML: importIndexFieldFromYAML,
      exportToXML: exportIndexFieldToXML,
      exportToYAML: exportIndexFieldToYAML,
    },
  ],
  MetadataField: [
    {
      importFromXML: importMetadataFieldFromXML,
      importFromYAML: importMetadataFieldFromYAML,
      exportToXML: exportMetadataFieldToXML,
      exportToYAML: exportMetadataFieldToYAML,
    },
  ],
  MetadataValue: [
    {
      importFromXML: importMetadataValueFromXML,
      importFromYAML: importMetadataValueFromYAML,
      exportToXML: exportMetadataValueToXML,
      exportToYAML: exportMetadataValueToYAML,
    },
  ],
  MetadataValueCollection: [
    {
      importFromXML: importMetadataValueCollectionFromXML,
      importFromYAML: importMetadataValueCollectionFromYAML,
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
      importFromYAML: importPredefinedFromYAML,
      exportToXML: exportPredefinedToXML,
      exportToYAML: exportPredefinedToYAML,
    },
  ],
  TypeLink: [
    {
      importFromXML: importTypeLinkFromXML,
      importFromYAML: importTypeLinkFromYAML,
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
      importFromYAML: importUsePurposesFromYAML,
      exportToXML: exportUsePurposesToXML,
      exportToYAML: exportUsePurposesToYAML,
    },
  ],
  UserVisible: [
    {
      importFromXML: importUserVisibleFromXML,
      importFromYAML: importUserVisibleFromYAML,
      exportToXML: exportUserVisibleToXML,
      exportToYAML: exportUserVisibleToYAML,
    },
  ],
  ChoiceParameters: [
    {
      importFromXML: importChoiceParametersFromXML,
      importFromYAML: importChoiceParametersFromYAML,
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
