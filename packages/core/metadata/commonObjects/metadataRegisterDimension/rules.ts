import { commonRegisterFieldProperties } from "~/metadata/commonObjects/metadataRegisterField/rules"
import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const registerParentItemTypes = [
  "MetadataAccumulationRegister",
  "MetadataInformationRegister",
  "MetadataAccountingRegister",
  "MetadataCalculationRegister",
] as const

export const MetadataRegisterDimensionRules = {
  itemType: "MetadataRegisterDimension",
  properties: {
    ...commonRegisterFieldProperties,
    master: {
      yaml: "Ведущее",
      xml: "Master",
      type: "boolean",
      xmlParents: ["Properties"],
      defaultValueXML: false,
      defaultValueYAML: false,
      toXML: (metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        exportDimensionDefaultForXML("master", metadataItem, context, "MetadataInformationRegister"),
      order: 26,
    },
    mainFilter: {
      yaml: "ОсновнойОтбор",
      xml: "MainFilter",
      type: "boolean",
      xmlParents: ["Properties"],
      defaultValueXML: true,
      defaultValueYAML: true,
      toXML: (metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        exportDimensionDefaultForXML("mainFilter", metadataItem, context, "MetadataInformationRegister"),
      order: 26,
    },
    denyIncompleteValues: {
      yaml: "ЗапретНезавершенныхЗначений",
      xml: "DenyIncompleteValues",
      type: "boolean",
      xmlParents: ["Properties"],
      defaultValueXML: false,
      defaultValueYAML: false,
      order: 26,
    },
    baseDimension: {
      yaml: "БазовоеИзмерение",
      xml: "BaseDimension",
      type: "boolean",
      xmlParents: ["Properties"],
      defaultValueXML: false,
      defaultValueYAML: false,
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) => isCalculationRegisterField(context),
    },
    scheduleLink: {
      yaml: "СвязьСГрафиком",
      xml: "ScheduleLink",
      type: "string",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) => isCalculationRegisterField(context),
    },
    balance: {
      yaml: "Балансовый",
      xml: "Balance",
      type: "boolean",
      xmlParents: ["Properties"],
      defaultValueXML: true,
      defaultValueYAML: true,
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) => isAccountingRegisterField(context),
    },
    accountingFlag: {
      yaml: "ПризнакУчета",
      xml: "AccountingFlag",
      type: "string",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) => isAccountingRegisterField(context),
    },
    useInTotals: {
      yaml: "ИспользоватьВИтогах",
      xml: "UseInTotals",
      type: "boolean",
      xmlParents: ["Properties"],
      defaultValueXML: true,
      defaultValueYAML: true,
      toXML: (metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        exportDimensionDefaultForXML("useInTotals", metadataItem, context, "MetadataAccumulationRegister"),
      order: 30,
    },
    typeReductionMode: {
      yaml: "РежимСокращенияТипа",
      xml: "TypeReductionMode",
      type: "SystemEnumeration",
      typeSE: "TypeReductionMode",
      xmlParents: ["Properties"],
      defaultValueXML: "TransformValues",
      defaultValueYAML: "TransformValues",
      toXML: (metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        exportDimensionDefaultForXML("typeReductionMode", metadataItem, context, "MetadataInformationRegister"),
      order: 31,
    },
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
