import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "../forms/elements/calendarField/rules"
import { exportSystemEnumerationToYAML } from "../systemEnumerations/exportToEnterprise"
import { exportSystemEnumerationToPreview } from "../systemEnumerations/exportToPreview"
import { importSystemEnumerationFromYAML } from "../systemEnumerations/importFromEnterprise"
import { exportBooleanToEnterprise } from "./boolean/exportToEnterprise"
import { importBooleanFromEnterprise } from "./boolean/importFromEnterprise"
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
import { importFieldsListFromEnterprise } from "./fieldsList/importFromEnterprise"
import { importFieldsListFromXML } from "./fieldsList/importFromXML"
import { exportFontToEnterprise } from "./font/exportToEnterprise"
import { exportFontToPreview } from "./font/exportToPreview"
import { exportFontToXML } from "./font/exportToXML"
import { importFontFromEnterprise } from "./font/importFromEnterprise"
import { importFontFromXML } from "./font/importFromXML"
import { exportFormattedI8nTextToEnterprise } from "./formattedI8nText/exportToEnterprise"
import { exportFormattedI8nTextToXML } from "./formattedI8nText/exportToXML"
import { importFormattedI8nTextFromEnterprise } from "./formattedI8nText/importFromEnterprise"
import { importFormattedI8nTextFromXML } from "./formattedI8nText/importFromXML"
import { exportFormParametersToEnterprise } from "./formParameter/exportToEnterprise"
import { exportFormParametersToXML } from "./formParameter/exportToXML"
import { importFormParametersFromEnterprise } from "./formParameter/importFromEnterprise"
import { importFormParametersFromXML } from "./formParameter/importFromXML"
import { exportFunctionalOptionsToEnterprise } from "./functionalOptionsProperty/exportToEnterprise"
import { exportFunctionalOptionsToXML } from "./functionalOptionsProperty/exportToXML"
import { importFunctionalOptionsFromEnterprise } from "./functionalOptionsProperty/importFromEnterprise"
import { importFunctionalOptionsFromXML } from "./functionalOptionsProperty/importFromXML"
import { exportI8nTextToEnterprise } from "./i8nText/exportToEnterprise"
import { exportI8nTextToPreview } from "./i8nText/exportToPreview"
import { exportI8nTextToXML } from "./i8nText/exportToXML"
import { importI8nTextFromEnterprise } from "./i8nText/importFromEnterprise"
import { importI8nTextFromXML } from "./i8nText/importFromXML"
import { exportIndexFieldToEnterprise } from "./indexField/exportToEnterprise"
import { exportIndexFieldToXML } from "./indexField/exportToXML"
import { importIndexFieldFromEnterprise } from "./indexField/importFromEnterprise"
import { importIndexFieldFromXML } from "./indexField/importFromXML"
import { exportMetadataFieldToEnterprise } from "./metadataField/exportToEnterprise"
import { exportMetadataFieldToXML } from "./metadataField/exportToXML"
import { importMetadataFieldFromEnterprise } from "./metadataField/importFromEnterprise"
import { importMetadataFieldFromXML } from "./metadataField/importFromXML"
import { exportMetadataValueToEnterprise } from "./metadataValue/exportToEnterprise"
import { exportMetadataValueToXML } from "./metadataValue/exportToXML"
import { importMetadataValueFromEnterprise } from "./metadataValue/importFromEnterprise"
import { importMetadataValueFromXML } from "./metadataValue/importFromXML"
import { exportMetadataValueCollectionToXML } from "./metadataValueCollection/exportToXML"
import { importMetadataValueCollectionFromEnterprise } from "./metadataValueCollection/importFromEnterprise"
import { importMetadataValueCollectionFromXML } from "./metadataValueCollection/importFromXML"
import { exportPictureToEnterprise } from "./picture/exportToEnterprise"
import { exportPictureToXML } from "./picture/exportToXML"
import { exportPredefinedToEnterprise } from "./predifined/exportToEnterprise"
import { exportPredefinedToXML } from "./predifined/exportToXML"
import { importPredefinedFromEnterprise } from "./predifined/importFromEnterprise"
import { importPredefinedFromXML } from "./predifined/importFromXML"
import { exportTypeDescriptionToEnterprise } from "./typeDescription/exportToEnterprise"
import { exportTypeDescriptionToXML } from "./typeDescription/exportToXML"
import { exportTypeLinkToEnterprise } from "./typeLink/exportToEnterprise"
import { exportTypeLinkToXML } from "./typeLink/exportToXML"
import { importTypeLinkFromEnterprise } from "./typeLink/importFromEnterprise"
import { importTypeLinkFromXML } from "./typeLink/importFromXML"
import { exportUsePurposesToEnterprise } from "./usePurposes/exportToEnterprise"
import { exportUsePurposesToXML } from "./usePurposes/exportToXML"
import { importUsePurposesFromEnterprise } from "./usePurposes/importFromEnterprise"
import { importUsePurposesFromXML } from "./usePurposes/importFromXML"
import { exportUserVisibleToEnterprise } from "./userVisible/exportToEnterprise"
import { exportUserVisibleToXML } from "./userVisible/exportToXML"
import { importUserVisibleFromEnterprise } from "./userVisible/importFromEnterprise"
import { importUserVisibleFromXML } from "./userVisible/importFromXML"
import { exportChoiceParametersToEnterprise } from "./сhoiceParameters/exportToEnterprise"
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
  exportToXML?: (context: ConfigurationContext, data: any, ...args: any[]) => any
  importFromYAML?: (context: ConfigurationContext, data: any, ...args: any[]) => any
  exportToYAML?: (context: ConfigurationContext, data: any, ...args: any[]) => any
  exportToPreview?: (context: ConfigurationContext, data: any, ...args: any[]) => any
}

export const TypeRules: Record<string, TypeRule[]> = {
  boolean: [
    {
      importFromXML: importBooleanFromXML,
      importFromYAML: importBooleanFromEnterprise,
      exportToYAML: exportBooleanToEnterprise,
    },
  ],
  Border: [
    {
      importFromXML: importBorderFromXML,
      importFromYAML: importBorderFromEnterprise,
      exportToXML: exportBorderToXML,
      exportToYAML: exportBorderToEnterprise,
    },
  ],
  Color: [
    {
      importFromXML: importColorFromXML,
      importFromYAML: importColorFromEnterprise,
      exportToXML: exportColorToXML,
      exportToYAML: exportColorToEnterprise,
    },
  ],
  DynamicList: [
    {
      exportToXML: exportDynamicListToXML,
      exportToYAML: exportDynamicListToEnterprise,
    },
  ],
  FieldsList: [
    {
      importFromXML: importFieldsListFromXML,
      importFromYAML: importFieldsListFromEnterprise,
      exportToXML: exportFieldsListToXML,
      exportToYAML: exportFieldsListToEnterprise,
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
      exportToYAML: exportFormattedI8nTextToEnterprise,
    },
  ],
  FormParameter: [
    {
      importFromXML: importFormParametersFromXML,
      importFromYAML: importFormParametersFromEnterprise,
      exportToXML: exportFormParametersToXML,
      exportToYAML: exportFormParametersToEnterprise,
    },
  ],
  FunctionalOptionsProperty: [
    {
      importFromXML: importFunctionalOptionsFromXML,
      importFromYAML: importFunctionalOptionsFromEnterprise,
      exportToXML: exportFunctionalOptionsToXML,
      exportToYAML: exportFunctionalOptionsToEnterprise,
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
      exportToYAML: exportIndexFieldToEnterprise,
    },
  ],
  MetadataField: [
    {
      importFromXML: importMetadataFieldFromXML,
      importFromYAML: importMetadataFieldFromEnterprise,
      exportToXML: exportMetadataFieldToXML,
      exportToYAML: exportMetadataFieldToEnterprise,
    },
  ],
  MetadataValue: [
    {
      importFromXML: importMetadataValueFromXML,
      importFromYAML: importMetadataValueFromEnterprise,
      exportToXML: exportMetadataValueToXML,
      exportToYAML: exportMetadataValueToEnterprise,
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
      exportToYAML: exportPictureToEnterprise,
    },
  ],
  Predefined: [
    {
      importFromXML: importPredefinedFromXML,
      importFromYAML: importPredefinedFromEnterprise,
      exportToXML: exportPredefinedToXML,
      exportToYAML: exportPredefinedToEnterprise,
    },
  ],
  TypeLink: [
    {
      importFromXML: importTypeLinkFromXML,
      importFromYAML: importTypeLinkFromEnterprise,
      exportToXML: exportTypeLinkToXML,
      exportToYAML: exportTypeLinkToEnterprise,
    },
  ],
  TypeDescription: [
    {
      exportToXML: exportTypeDescriptionToXML,
      exportToYAML: exportTypeDescriptionToEnterprise,
    },
  ],
  UsePurposes: [
    {
      importFromXML: importUsePurposesFromXML,
      importFromYAML: importUsePurposesFromEnterprise,
      exportToXML: exportUsePurposesToXML,
      exportToYAML: exportUsePurposesToEnterprise,
    },
  ],
  UserVisible: [
    {
      importFromXML: importUserVisibleFromXML,
      importFromYAML: importUserVisibleFromEnterprise,
      exportToXML: exportUserVisibleToXML,
      exportToYAML: exportUserVisibleToEnterprise,
    },
  ],
  ChoiceParameters: [
    {
      importFromXML: importChoiceParametersFromXML,
      importFromYAML: importChoiceParametersFromEnterprise,
      exportToXML: exportChoiceParametersToXML,
      exportToYAML: exportChoiceParametersToEnterprise,
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
