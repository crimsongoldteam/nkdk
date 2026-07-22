import { booleanRule } from "../boolean/types"
import { stringRule } from "../string/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { commonRegisterFieldProperties } from "../metadataRegisterField/rules"
import { getParentFromContext } from "../../context/helpers"
import { ConfigurationContextWithExportToXML } from "../../context/types"
import type { MetadataItemRule } from "../../orchestration/property/types"
import type { YAMLPropertySource } from "../../orchestration/property/fromYAMLToXMLTypes"
const registerParentItemTypes = [
  "MetadataAccumulationRegister",
  "MetadataInformationRegister",
  "MetadataAccountingRegister",
  "MetadataCalculationRegister",
] as const
const dimensionExternalMetadata = { segment: "Dimension", placement: "ownerChild" } as const
export const MetadataRegisterDimensionRules = {
  itemType: "MetadataRegisterDimension",
  externalMetadata: dimensionExternalMetadata,
  properties: {
    ...commonRegisterFieldProperties,
    master: booleanRule({
      yaml: "Ведущее",
      xml: "Master",
      xmlParents: ["Properties"],
      defaultValueXML: false,
      implicitValueYAML: false,
      toXML: (source: YAMLPropertySource | unknown, context?: ConfigurationContextWithExportToXML) =>
        exportDimensionDefaultForXML("master", source, context, "MetadataInformationRegister"),
      order: 26,
    }),
    mainFilter: booleanRule({
      yaml: "ОсновнойОтбор",
      xml: "MainFilter",
      xmlParents: ["Properties"],
      defaultValueXML: true,
      implicitValueYAML: true,
      toXML: (source: YAMLPropertySource | unknown, context?: ConfigurationContextWithExportToXML) =>
        exportDimensionDefaultForXML("mainFilter", source, context, "MetadataInformationRegister"),
      order: 26,
    }),
    denyIncompleteValues: booleanRule({
      yaml: "ЗапретНезавершенныхЗначений",
      xml: "DenyIncompleteValues",
      xmlParents: ["Properties"],
      defaultValueXML: false,
      implicitValueYAML: false,
      order: 26,
    }),
    baseDimension: booleanRule({
      yaml: "БазовоеИзмерение",
      xml: "BaseDimension",
      xmlParents: ["Properties"],
      defaultValueXML: false,
      implicitValueYAML: false,
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        isCalculationRegisterField(context),
    }),
    scheduleLink: stringRule({
      yaml: "СвязьСГрафиком",
      xml: "ScheduleLink",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        isCalculationRegisterField(context),
    }),
    balance: booleanRule({
      yaml: "Балансовый",
      xml: "Balance",
      xmlParents: ["Properties"],
      defaultValueXML: true,
      implicitValueYAML: true,
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        isAccountingRegisterField(context),
      order: 25.1,
    }),
    accountingFlag: stringRule({
      yaml: "ПризнакУчета",
      xml: "AccountingFlag",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        isAccountingRegisterField(context),
      order: 25.2,
    }),
    useInTotals: booleanRule({
      yaml: "ИспользоватьВИтогах",
      xml: "UseInTotals",
      xmlParents: ["Properties"],
      defaultValueXML: true,
      implicitValueYAML: true,
      toXML: (source: YAMLPropertySource | unknown, context?: ConfigurationContextWithExportToXML) =>
        exportDimensionDefaultForXML("useInTotals", source, context, "MetadataAccumulationRegister"),
      order: 30,
    }),
    typeReductionMode: systemEnumerationRule({
      yaml: "РежимСокращенияТипа",
      xml: "TypeReductionMode",
      typeSE: "TypeReductionMode",
      xmlParents: ["Properties"],
      defaultValueXML: "TransformValues",
      implicitValueYAML: "TransformValues",
      toXML: (source: YAMLPropertySource | unknown, context?: ConfigurationContextWithExportToXML) =>
        exportDimensionDefaultForXML("typeReductionMode", source, context, "MetadataInformationRegister"),
      order: 31,
    }),
  },
} as const satisfies MetadataItemRule
const exportDimensionDefaultForXML = (
  propertyKey: string,
  source: YAMLPropertySource | unknown,
  context: ConfigurationContextWithExportToXML | undefined,
  parentItemTypeWithDefault: string
): boolean => {
  if (!context) return true
  const parent = getParentFromContext(context, [...registerParentItemTypes] as never[])
  if (!registerParentItemTypes.includes(parent.itemType as (typeof registerParentItemTypes)[number])) {
    return true
  }
  if (parent.itemType === parentItemTypeWithDefault) {
    return true
  }
  return hasProperty(source, propertyKey)
}
const hasProperty = (source: YAMLPropertySource | unknown, propertyKey: string): boolean =>
  source !== null &&
  source !== undefined &&
  typeof source === "object" &&
  ("has" in source && typeof source.has === "function"
    ? source.has(propertyKey)
    : Object.prototype.hasOwnProperty.call(source, propertyKey))
const isAccountingRegisterField = (context?: ConfigurationContextWithExportToXML): boolean =>
  context
    ? getParentFromContext(context, ["MetadataAccountingRegister" as never]).itemType === "MetadataAccountingRegister"
    : false
const isCalculationRegisterField = (context?: ConfigurationContextWithExportToXML): boolean =>
  context
    ? getParentFromContext(context, ["MetadataCalculationRegister" as never]).itemType === "MetadataCalculationRegister"
    : false
