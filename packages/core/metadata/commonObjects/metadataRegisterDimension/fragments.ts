import { getParentFromContext } from "../../context/helpers"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import type { YAMLPropertySource } from "../../orchestration/property/fromYAMLToXMLTypes"
import { booleanRule } from "../boolean/types"
import { metadataRuleFragment } from "../metadataRuleFragment"
import { stringRule } from "../string/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"

const registerParentItemTypes = [
  "MetadataAccumulationRegister",
  "MetadataInformationRegister",
  "MetadataAccountingRegister",
  "MetadataCalculationRegister",
] as const

export const metadataRegisterDimensionRuleBase = {
  itemType: "MetadataRegisterDimension",
  externalMetadata: { segment: "Dimension", placement: "ownerChild" },
} as const

const master = booleanRule({
  yaml: "Ведущее",
  xml: "Master",
  xmlParents: ["Properties"],
  defaultValueXML: false,
  implicitValueYAML: false,
  toXML: (source: YAMLPropertySource | unknown, context?: ConfigurationContextWithExportToXML) =>
    exportDimensionDefaultForXML("master", source, context, "MetadataInformationRegister"),
})

const mainFilter = booleanRule({
  yaml: "ОсновнойОтбор",
  xml: "MainFilter",
  xmlParents: ["Properties"],
  defaultValueXML: true,
  implicitValueYAML: true,
  toXML: (source: YAMLPropertySource | unknown, context?: ConfigurationContextWithExportToXML) =>
    exportDimensionDefaultForXML("mainFilter", source, context, "MetadataInformationRegister"),
})

const balance = booleanRule({
  yaml: "Балансовый",
  xml: "Balance",
  xmlParents: ["Properties"],
  defaultValueXML: true,
  implicitValueYAML: true,
  toXML: (_source: unknown, context?: ConfigurationContextWithExportToXML) =>
    isAccountingRegisterField(context),
})

const accountingFlag = stringRule({
  yaml: "ПризнакУчета",
  xml: "AccountingFlag",
  xmlParents: ["Properties"],
  defaultValueXMLRaw: "",
  toXML: (_source: unknown, context?: ConfigurationContextWithExportToXML) =>
    isAccountingRegisterField(context),
})

const denyIncompleteValues = booleanRule({
  yaml: "ЗапретНезавершенныхЗначений",
  xml: "DenyIncompleteValues",
  xmlParents: ["Properties"],
  defaultValueXML: false,
  implicitValueYAML: false,
})

const baseDimension = booleanRule({
  yaml: "БазовоеИзмерение",
  xml: "BaseDimension",
  xmlParents: ["Properties"],
  defaultValueXML: false,
  implicitValueYAML: false,
  toXML: (_source: unknown, context?: ConfigurationContextWithExportToXML) =>
    isCalculationRegisterField(context),
})

const scheduleLink = stringRule({
  yaml: "СвязьСГрафиком",
  xml: "ScheduleLink",
  xmlParents: ["Properties"],
  defaultValueXMLRaw: "",
  toXML: (_source: unknown, context?: ConfigurationContextWithExportToXML) =>
    isCalculationRegisterField(context),
})

const useInTotals = booleanRule({
  yaml: "ИспользоватьВИтогах",
  xml: "UseInTotals",
  xmlParents: ["Properties"],
  defaultValueXML: true,
  implicitValueYAML: true,
  toXML: (source: YAMLPropertySource | unknown, context?: ConfigurationContextWithExportToXML) =>
    exportDimensionDefaultForXML("useInTotals", source, context, "MetadataAccumulationRegister"),
})

const typeReductionMode = systemEnumerationRule({
  yaml: "РежимСокращенияТипа",
  xml: "TypeReductionMode",
  typeSE: "TypeReductionMode",
  xmlParents: ["Properties"],
  defaultValueXML: "TransformValues",
  implicitValueYAML: "TransformValues",
  toXML: (source: YAMLPropertySource | unknown, context?: ConfigurationContextWithExportToXML) =>
    exportDimensionDefaultForXML("typeReductionMode", source, context, "MetadataInformationRegister"),
})

export const registerDimensionRoleFragment = metadataRuleFragment(
  ["master", "mainFilter", "balance", "accountingFlag", "denyIncompleteValues", "baseDimension", "scheduleLink"],
  { master, mainFilter, balance, accountingFlag, denyIncompleteValues, baseDimension, scheduleLink }
)

export const registerDimensionTotalsFragment = metadataRuleFragment(
  ["useInTotals", "typeReductionMode"],
  { useInTotals, typeReductionMode }
)

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
  if (parent.itemType === parentItemTypeWithDefault) return true
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
    ? getParentFromContext(context, ["MetadataAccountingRegister" as never]).itemType ===
      "MetadataAccountingRegister"
    : false

const isCalculationRegisterField = (context?: ConfigurationContextWithExportToXML): boolean =>
  context
    ? getParentFromContext(context, ["MetadataCalculationRegister" as never]).itemType ===
      "MetadataCalculationRegister"
    : false
