import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "../forms/elements/calendarField/rules"
import { exportSystemEnumerationToYAML } from "../systemEnumerations/exportToEnterprise"
import { exportSystemEnumerationToPreview } from "../systemEnumerations/exportToPreview"
import { importSystemEnumerationFromYAML } from "../systemEnumerations/importFromEnterprise"
import { _importBooleanFromXML } from "./boolean/_importFromXML"
import { exportBooleanToYAML } from "./boolean/exportToYAML"
import { _exportBorderToXML } from "./border/_exportToXML"
import { _importBorderFromXML } from "./border/_importFromXML"
import { exportBorderToYAML } from "./border/exportToYAML"
import { importBorderFromYAML } from "./border/importFromYAML"
import { _exportColorToXML } from "./color/_exportToXML"
import { _importColorFromXML } from "./color/_importFromXML"
import { exportColorToYAML } from "./color/exportToYAML"
import { importColorFromYAML } from "./color/importFromYAML"
import { exportDynamicListToYAML } from "./dynamicList/exportToYAML"
import { _importFieldsListFromXML } from "./fieldsList/_importFromXML"
import { exportFieldsListToYAML } from "./fieldsList/exportToYAML"
import { _importFontFromXML } from "./font/_importFromXML"
import { exportFontToEnterprise } from "./font/exportToEnterprise"
import { exportFontToPreview } from "./font/exportToPreview"
import { importFontFromYAML } from "./font/importFromYAML"
import { exportFormattedI8nTextToXML } from "./formattedI8nText/_exportToXML"
import { _importFormattedI8nTextFromXML } from "./formattedI8nText/_importFromXML"
import { exportFormattedI8nTextToYAML } from "./formattedI8nText/exportToYAML"
import { importFormattedI8nTextFromYAML } from "./formattedI8nText/importFromYAML"
import { _exportFormParametersToXML } from "./formParameter/_exportToXML"
import { _importFormParametersFromXML } from "./formParameter/_importFromXML"
import { exportFormParametersToYAML } from "./formParameter/exportToYAML"
import { importFormParametersFromYAML } from "./formParameter/importFromYAML"
import { _exportFunctionalOptionsToXML } from "./functionalOptionsProperty/_exportToXML"
import { _importFunctionalOptionsFromXML } from "./functionalOptionsProperty/_importFromXML"
import { exportFunctionalOptionsToYAML } from "./functionalOptionsProperty/exportToYAML"
import { importFunctionalOptionsFromYAML } from "./functionalOptionsProperty/importFromYAML"
import { _exportI8nTextToXML } from "./i8nText/_exportToXML"
import { _importI8nTextFromXML } from "./i8nText/_importFromXML"
import { exportI8nTextToEnterprise } from "./i8nText/exportToEnterprise"
import { exportI8nTextToPreview } from "./i8nText/exportToPreview"
import { importI8nTextFromYAML } from "./i8nText/importFromYAML"
import { _exportIndexFieldToXML } from "./indexField/_exportToXML"
import { _importIndexFieldFromXML } from "./indexField/_importFromXML"
import { exportIndexFieldToYAML } from "./indexField/exportToYAML"
import { importIndexFieldFromYAML } from "./indexField/importFromYAML"
import { _exportMetadataFieldToXML } from "./metadataField/_exportToXML"
import { _importMetadataFieldFromXML } from "./metadataField/_importFromXML"
import { exportMetadataFieldToYAML } from "./metadataField/exportToYAML"
import { importMetadataFieldFromYAML } from "./metadataField/importFromYAML"
import { _exportMetadataValueToXML } from "./metadataValue/_exportToXML"
import { _importMetadataValueFromXML } from "./metadataValue/_importFromXML"
import { exportMetadataValueToYAML } from "./metadataValue/exportToYAML"
import { importMetadataValueFromYAML } from "./metadataValue/importFromYAML"
import { _exportMetadataValueCollectionToXML } from "./metadataValueCollection/_exportToXML"
import { _importMetadataValueCollectionFromXML } from "./metadataValueCollection/_importFromXML"
import { importMetadataValueCollectionFromYAML } from "./metadataValueCollection/importFromYAML"
import { exportPictureToYAML } from "./picture/exportToYAML"
import { _exportPredefinedToXML } from "./predifined/_exportToXML"
import { _importPredefinedFromXML } from "./predifined/_importFromXML"
import { exportPredefinedToYAML } from "./predifined/exportToYAML"
import { importPredefinedFromYAML } from "./predifined/importFromYAML"
import { _exportTypeDescriptionToXML } from "./typeDescription/_exportToXML"
import { exportTypeDescriptionToYAML } from "./typeDescription/exportToYAML"
import { _exportTypeLinkToXML } from "./typeLink/_exportToXML"
import { _importTypeLinkFromXML } from "./typeLink/_importFromXML"
import { exportTypeLinkToYAML } from "./typeLink/exportToYAML"
import { importTypeLinkFromYAML } from "./typeLink/importFromYAML"
import { _exportUsePurposesToXML } from "./usePurposes/_exportToXML"
import { _importUsePurposesFromXML } from "./usePurposes/_importFromXML"
import { exportUsePurposesToYAML } from "./usePurposes/exportToYAML"
import { importUsePurposesFromYAML } from "./usePurposes/importFromYAML"
import { _exportUserVisibleToXML } from "./userVisible/_exportToXML"
import { _importUserVisibleFromXML } from "./userVisible/_importFromXML"
import { exportUserVisibleToYAML } from "./userVisible/exportToYAML"
import { importUserVisibleFromYAML } from "./userVisible/importFromYAML"
import { _exportChoiceParametersToXML } from "./сhoiceParameters/_exportToXML"
import { _importChoiceParametersFromXML } from "./сhoiceParameters/_importFromXML"
import { exportChoiceParametersToYAML } from "./сhoiceParameters/exportToYAML"
import { importChoiceParametersFromYAML } from "./сhoiceParameters/importFromYAML"

interface TypeRule {
  importFromXML?: (
    context: ConfigurationContext,
    _rule: PropertyRule | undefined,
    rule: PropertyRule,
    data: any | undefined,
    ...args: any[]
  ) => any | undefined
  exportToXML?: (context: ConfigurationContext, _rule: PropertyRule | undefined, data: any, rule?: PropertyRule) => any
  importFromYAML?: (
    context: ConfigurationContext,
    _rule: PropertyRule | undefined,
    rule: PropertyRule,
    data: any
  ) => any
  exportToYAML?: (context: ConfigurationContext, _rule: PropertyRule | undefined, rule: PropertyRule, data: any) => any
  exportToPreview?: (
    context: ConfigurationContext,
    _rule: PropertyRule | undefined,
    rule: PropertyRule,
    data: any
  ) => any
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
      importFromXML: _importBorderFromXML,
      importFromYAML: importBorderFromYAML,
      exportToXML: _exportBorderToXML,
      exportToYAML: exportBorderToYAML,
    },
  ],
  Color: [
    {
      importFromXML: _importColorFromXML,
      importFromYAML: importColorFromYAML,
      exportToXML: _exportColorToXML,
      exportToYAML: exportColorToYAML,
    },
  ],
  DynamicList: [
    {
      exportToXML: _exportDynamicListToXML,
      exportToYAML: exportDynamicListToYAML,
    },
  ],
  FieldsList: [
    {
      importFromXML: _importFieldsListFromXML,
      importFromYAML: exportFieldsListFromYAML,
      exportToXML: _exportFieldsListToXML,
      exportToYAML: exportFieldsListToYAML,
    },
  ],
  Font: [
    {
      importFromXML: _importFontFromXML,
      importFromYAML: importFontFromYAML,
      exportToXML: _exportFontToXML,
      exportToYAML: exportFontToEnterprise,
      exportToPreview: exportFontToPreview,
    },
  ],
  FormattedI8nText: [
    {
      importFromXML: _importFormattedI8nTextFromXML,
      importFromYAML: importFormattedI8nTextFromYAML,
      exportToXML: exportFormattedI8nTextToXML,
      exportToYAML: exportFormattedI8nTextToYAML,
    },
  ],
  FormParameter: [
    {
      importFromXML: _importFormParametersFromXML,
      importFromYAML: importFormParametersFromYAML,
      exportToXML: _exportFormParametersToXML,
      exportToYAML: exportFormParametersToYAML,
    },
  ],
  FunctionalOptionsProperty: [
    {
      importFromXML: _importFunctionalOptionsFromXML,
      importFromYAML: importFunctionalOptionsFromYAML,
      exportToXML: _exportFunctionalOptionsToXML,
      exportToYAML: exportFunctionalOptionsToYAML,
    },
  ],
  I8nText: [
    {
      importFromXML: _importI8nTextFromXML,
      importFromYAML: importI8nTextFromYAML,
      exportToXML: _exportI8nTextToXML,
      exportToYAML: exportI8nTextToEnterprise,
      exportToPreview: exportI8nTextToPreview,
    },
  ],
  IndexField: [
    {
      importFromXML: _importIndexFieldFromXML,
      importFromYAML: importIndexFieldFromYAML,
      exportToXML: _exportIndexFieldToXML,
      exportToYAML: exportIndexFieldToYAML,
    },
  ],
  MetadataField: [
    {
      importFromXML: _importMetadataFieldFromXML,
      importFromYAML: importMetadataFieldFromYAML,
      exportToXML: _exportMetadataFieldToXML,
      exportToYAML: exportMetadataFieldToYAML,
    },
  ],
  MetadataValue: [
    {
      importFromXML: _importMetadataValueFromXML,
      importFromYAML: importMetadataValueFromYAML,
      exportToXML: _exportMetadataValueToXML,
      exportToYAML: exportMetadataValueToYAML,
    },
  ],
  MetadataValueCollection: [
    {
      importFromXML: _importMetadataValueCollectionFromXML,
      importFromYAML: importMetadataValueCollectionFromYAML,
      exportToXML: _exportMetadataValueCollectionToXML,
    },
  ],
  Picture: [
    {
      exportToXML: _exportPictureToXML,
      exportToYAML: exportPictureToYAML,
    },
  ],
  Predefined: [
    {
      importFromXML: _importPredefinedFromXML,
      importFromYAML: importPredefinedFromYAML,
      exportToXML: _exportPredefinedToXML,
      exportToYAML: exportPredefinedToYAML,
    },
  ],
  TypeLink: [
    {
      importFromXML: _importTypeLinkFromXML,
      importFromYAML: importTypeLinkFromYAML,
      exportToXML: _exportTypeLinkToXML,
      exportToYAML: exportTypeLinkToYAML,
    },
  ],
  TypeDescription: [
    {
      exportToXML: _exportTypeDescriptionToXML,
      exportToYAML: exportTypeDescriptionToYAML,
    },
  ],
  UsePurposes: [
    {
      importFromXML: _importUsePurposesFromXML,
      importFromYAML: importUsePurposesFromYAML,
      exportToXML: _exportUsePurposesToXML,
      exportToYAML: exportUsePurposesToYAML,
    },
  ],
  UserVisible: [
    {
      importFromXML: _importUserVisibleFromXML,
      importFromYAML: importUserVisibleFromYAML,
      exportToXML: _exportUserVisibleToXML,
      exportToYAML: exportUserVisibleToYAML,
    },
  ],
  ChoiceParameters: [
    {
      importFromXML: _importChoiceParametersFromXML,
      importFromYAML: importChoiceParametersFromYAML,
      exportToXML: _exportChoiceParametersToXML,
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
