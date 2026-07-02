import { booleanRule } from "../boolean/types"
import { stringRule } from "../string/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { commonRegisterFieldProperties } from "../metadataRegisterField/rules"
import { getParentFromContext } from "../../context/helpers"
import { ConfigurationContextWithExportToXML } from "../../context/types"
import type { MetadataItemRule } from "../../orchestration/property/types"
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
      toXML: (metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        exportDimensionDefaultForXML("master", metadataItem, context, "MetadataInformationRegister"),
      order: 26,
    }),
    mainFilter: booleanRule({
      yaml: "ОсновнойОтбор",
      xml: "MainFilter",
      xmlParents: ["Properties"],
      defaultValueXML: true,
      implicitValueYAML: true,
      toXML: (metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        exportDimensionDefaultForXML("mainFilter", metadataItem, context, "MetadataInformationRegister"),
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
      toXML: (metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        exportDimensionDefaultForXML("useInTotals", metadataItem, context, "MetadataAccumulationRegister"),
      order: 30,
    }),
    typeReductionMode: systemEnumerationRule({
      yaml: "РежимСокращенияТипа",
      xml: "TypeReductionMode",
      typeSE: "TypeReductionMode",
      xmlParents: ["Properties"],
      defaultValueXML: "TransformValues",
      implicitValueYAML: "TransformValues",
      toXML: (metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        exportDimensionDefaultForXML("typeReductionMode", metadataItem, context, "MetadataInformationRegister"),
      order: 31,
    }),
  },
} as const satisfies MetadataItemRule
const exportDimensionDefaultForXML = (
  propertyKey: string,
  metadataItem: unknown,
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
  return (
    metadataItem !== null &&
    metadataItem !== undefined &&
    typeof metadataItem === "object" &&
    Object.prototype.hasOwnProperty.call(metadataItem, propertyKey)
  )
}
const isAccountingRegisterField = (context?: ConfigurationContextWithExportToXML): boolean =>
  context
    ? getParentFromContext(context, ["MetadataAccountingRegister" as never]).itemType === "MetadataAccountingRegister"
    : false
const isCalculationRegisterField = (context?: ConfigurationContextWithExportToXML): boolean =>
  context
    ? getParentFromContext(context, ["MetadataCalculationRegister" as never]).itemType === "MetadataCalculationRegister"
    : false
