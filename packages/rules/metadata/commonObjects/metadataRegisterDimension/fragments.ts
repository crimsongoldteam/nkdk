import {
  booleanProperty,
  metadataRuleFragment,
  stringProperty,
  systemEnumerationProperty,
} from "../metadataRuleFragment"
import {
  registerFieldAccountingFlagProperty,
  registerFieldBalanceProperty,
} from "../metadataRegisterField/accountingProperties"
import { hasYAMLProperty, xmlDefaultVariant } from "../../ruleRuntime/property/xmlDefaultVariant"

const registerParentItemTypes = [
  "MetadataAccumulationRegister",
  "MetadataInformationRegister",
  "MetadataAccountingRegister",
  "MetadataCalculationRegister",
] as const

interface RegisterDimensionExportContext {
  exportToXML: {
    itemsTree: readonly { itemType: string }[]
    configurationIndex?: { readonly logicalAddress: string }
    xmlDefaultVariantByLogicalAddress?: Readonly<Record<string, "full" | "adopted" | "indexed">>
  }
}

export const metadataRegisterDimensionRuleBase = {
  itemType: "MetadataRegisterDimension",
  externalMetadata: { segment: "Dimension", placement: "ownerChild" },
} as const

const master = booleanProperty({
  yaml: "Ведущее",
  xml: "Master",
  xmlParents: ["Properties"],
  defaultValueXML: false,
  implicitValueYAML: false,
  toXML: (source: unknown, context?: RegisterDimensionExportContext) =>
    exportDimensionDefaultForXML("master", source, context, "MetadataInformationRegister"),
})

const mainFilter = booleanProperty({
  yaml: "ОсновнойОтбор",
  xml: "MainFilter",
  xmlParents: ["Properties"],
  defaultValueXML: true,
  implicitValueYAML: true,
  toXML: (source: unknown, context?: RegisterDimensionExportContext) =>
    exportDimensionDefaultForXML("mainFilter", source, context, "MetadataInformationRegister"),
})

const denyIncompleteValues = booleanProperty({
  yaml: "ЗапретНезавершенныхЗначений",
  xml: "DenyIncompleteValues",
  xmlParents: ["Properties"],
  defaultValueXML: false,
  implicitValueYAML: false,
})

const baseDimension = booleanProperty({
  yaml: "БазовоеИзмерение",
  xml: "BaseDimension",
  xmlParents: ["Properties"],
  defaultValueXML: false,
  implicitValueYAML: false,
  toXML: (source: unknown, context?: RegisterDimensionExportContext) =>
    isCalculationRegisterField(context) &&
    exportDimensionDefaultForXML("baseDimension", source, context, "MetadataCalculationRegister"),
})

const scheduleLink = stringProperty({
  yaml: "СвязьСГрафиком",
  xml: "ScheduleLink",
  xmlParents: ["Properties"],
  defaultValueXMLRaw: "",
  toXML: (source: unknown, context?: RegisterDimensionExportContext) =>
    isCalculationRegisterField(context) &&
    (xmlDefaultVariant(context) !== "adopted" || hasYAMLProperty(source, "scheduleLink")),
})

const useInTotals = booleanProperty({
  yaml: "ИспользоватьВИтогах",
  xml: "UseInTotals",
  xmlParents: ["Properties"],
  defaultValueXML: true,
  implicitValueYAML: true,
  toXML: (source: unknown, context?: RegisterDimensionExportContext) =>
    exportDimensionDefaultForXML("useInTotals", source, context, "MetadataAccumulationRegister"),
})

const typeReductionMode = systemEnumerationProperty({
  yaml: "РежимСокращенияТипа",
  xml: "TypeReductionMode",
  typeSE: "TypeReductionMode",
  xmlParents: ["Properties"],
  defaultValueXML: "TransformValues",
  implicitValueYAML: "TransformValues",
  toXML: (source: unknown, context?: RegisterDimensionExportContext) =>
    exportDimensionDefaultForXML("typeReductionMode", source, context, "MetadataInformationRegister"),
})

export const registerDimensionRoleFragment = metadataRuleFragment(
  ["master", "mainFilter", "balance", "accountingFlag", "denyIncompleteValues", "baseDimension", "scheduleLink"],
  {
    master,
    mainFilter,
    balance: registerFieldBalanceProperty,
    accountingFlag: registerFieldAccountingFlagProperty,
    denyIncompleteValues,
    baseDimension,
    scheduleLink,
  }
)

export const registerDimensionTotalsFragment = metadataRuleFragment(
  ["useInTotals", "typeReductionMode"],
  { useInTotals, typeReductionMode }
)

const exportDimensionDefaultForXML = (
  propertyKey: string,
  source: unknown,
  context: RegisterDimensionExportContext | undefined,
  parentItemTypeWithDefault: string
): boolean => {
  if (!context) return true
  if (xmlDefaultVariant(context) === "adopted") return hasYAMLProperty(source, propertyKey)
  const parentItemType = findParentItemType(context, registerParentItemTypes)
  if (parentItemType === undefined) return true
  if (parentItemType === parentItemTypeWithDefault) return true
  return hasYAMLProperty(source, propertyKey)
}

const isCalculationRegisterField = (
  context?: RegisterDimensionExportContext
): boolean =>
  context !== undefined &&
  findParentItemType(context, ["MetadataCalculationRegister"]) ===
    "MetadataCalculationRegister"

function findParentItemType(
  context: RegisterDimensionExportContext,
  itemTypes: readonly string[]
): string | undefined {
  for (let index = context.exportToXML.itemsTree.length - 1; index >= 0; index--) {
    const itemType = context.exportToXML.itemsTree[index].itemType
    if (itemTypes.includes(itemType)) return itemType
  }
  return undefined
}
