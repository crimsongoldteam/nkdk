import { getParentFromContext } from "../../context/helpers"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { composeMetadataItemRule } from "../metadataRuleFragment"
import {
  metadataTabularSectionRuleBase,
  tabularSectionAttributesFragment,
  tabularSectionFillCheckingFragment,
  tabularSectionIdentityFragment,
  tabularSectionInternalInfoFragment,
  tabularSectionLineNumberFragment,
  tabularSectionPresentationFragment,
  tabularSectionStandardAttributesFragment,
  tabularSectionUseFragment,
  tabularSectionUuidFragment,
} from "./fragments"

function getParentNameByItemType(
  context: ConfigurationContextWithExportToXML,
  parentItemType: string
): string {
  const elements = context.exportToXML.itemsTree
  for (let index = elements.length - 1; index >= 0; index -= 1) {
    const element = elements[index]
    if (String(element.itemType) === parentItemType) return element.name
  }
  return getParentFromContext(context).name
}

function ownerInternalInfo(params: {
  parentName: (context: ConfigurationContextWithExportToXML) => string
  typeName: string
}) {
  return tabularSectionInternalInfoFragment({
    getName: ({ context, metadata }) => `${params.parentName(context)}.${metadata.name}`,
    items: [
      { name: `${params.typeName}TabularSection`, category: "TabularSection" },
      { name: `${params.typeName}TabularSectionRow`, category: "TabularSectionRow" },
    ],
  })
}

const catalogInternalInfo = ownerInternalInfo({
  parentName: (context) => getParentFromContext(context, ["MetadataCatalog"]).name,
  typeName: "Catalog",
})
const documentInternalInfo = ownerInternalInfo({
  parentName: (context) => getParentFromContext(context, ["MetadataDocument"]).name,
  typeName: "Document",
})
const taskInternalInfo = ownerInternalInfo({
  parentName: (context) => getParentNameByItemType(context, "MetadataTask"),
  typeName: "Task",
})
const businessProcessInternalInfo = ownerInternalInfo({
  parentName: (context) => getParentNameByItemType(context, "MetadataBusinessProcess"),
  typeName: "BusinessProcess",
})
const dataProcessorInternalInfo = ownerInternalInfo({
  parentName: (context) => getParentNameByItemType(context, "MetadataDataProcessor"),
  typeName: "DataProcessor",
})
const reportInternalInfo = ownerInternalInfo({
  parentName: (context) => getParentNameByItemType(context, "MetadataReport"),
  typeName: "Report",
})
const exchangePlanInternalInfo = ownerInternalInfo({
  parentName: (context) => getParentNameByItemType(context, "MetadataExchangePlan"),
  typeName: "ExchangePlan",
})
const chartOfAccountsInternalInfo = ownerInternalInfo({
  parentName: (context) => getParentFromContext(context, ["MetadataChartOfAccounts" as never]).name,
  typeName: "ChartOfAccounts",
})
const chartOfCalculationTypesInternalInfo = ownerInternalInfo({
  parentName: (context) => getParentFromContext(context, ["MetadataChartOfCalculationTypes" as never]).name,
  typeName: "ChartOfCalculationTypes",
})
const chartOfCharacteristicTypesInternalInfo = ownerInternalInfo({
  parentName: (context) => getParentFromContext(context, ["MetadataChartOfCharacteristicTypes" as never]).name,
  typeName: "ChartOfCharacteristicTypes",
})

const commonAttributes = tabularSectionAttributesFragment("MetadataTabularSectionAttributes")
const attributesWithFill = tabularSectionAttributesFragment("MetadataTabularSectionAttributesWithFill")

export const MetadataTabularSectionRules = composeMetadataItemRule(
  metadataTabularSectionRuleBase,
  catalogInternalInfo,
  tabularSectionIdentityFragment,
  tabularSectionPresentationFragment,
  tabularSectionFillCheckingFragment,
  tabularSectionStandardAttributesFragment,
  tabularSectionUseFragment,
  tabularSectionLineNumberFragment,
  commonAttributes,
  tabularSectionUuidFragment
)

export const MetadataDocumentTabularSectionRules = composeMetadataItemRule(
  metadataTabularSectionRuleBase,
  documentInternalInfo,
  tabularSectionIdentityFragment,
  tabularSectionPresentationFragment,
  tabularSectionFillCheckingFragment,
  tabularSectionStandardAttributesFragment,
  tabularSectionLineNumberFragment,
  commonAttributes,
  tabularSectionUuidFragment
)

export const MetadataTaskTabularSectionRules = composeMetadataItemRule(
  metadataTabularSectionRuleBase,
  taskInternalInfo,
  tabularSectionIdentityFragment,
  tabularSectionPresentationFragment,
  tabularSectionFillCheckingFragment,
  tabularSectionStandardAttributesFragment,
  tabularSectionLineNumberFragment,
  commonAttributes,
  tabularSectionUuidFragment
)

export const MetadataBusinessProcessTabularSectionRules = composeMetadataItemRule(
  metadataTabularSectionRuleBase,
  businessProcessInternalInfo,
  tabularSectionIdentityFragment,
  tabularSectionPresentationFragment,
  tabularSectionFillCheckingFragment,
  tabularSectionStandardAttributesFragment,
  tabularSectionLineNumberFragment,
  commonAttributes,
  tabularSectionUuidFragment
)

export const MetadataDataProcessorTabularSectionRules = composeMetadataItemRule(
  metadataTabularSectionRuleBase,
  dataProcessorInternalInfo,
  tabularSectionIdentityFragment,
  tabularSectionPresentationFragment,
  tabularSectionFillCheckingFragment,
  tabularSectionStandardAttributesFragment,
  attributesWithFill,
  tabularSectionUuidFragment,
  tabularSectionLineNumberFragment
)

export const MetadataReportTabularSectionRules = composeMetadataItemRule(
  metadataTabularSectionRuleBase,
  reportInternalInfo,
  tabularSectionIdentityFragment,
  tabularSectionPresentationFragment,
  tabularSectionFillCheckingFragment,
  tabularSectionStandardAttributesFragment,
  attributesWithFill,
  tabularSectionUuidFragment,
  tabularSectionLineNumberFragment
)

export const MetadataExchangePlanTabularSectionRules = composeMetadataItemRule(
  metadataTabularSectionRuleBase,
  exchangePlanInternalInfo,
  tabularSectionIdentityFragment,
  tabularSectionPresentationFragment,
  tabularSectionFillCheckingFragment,
  tabularSectionStandardAttributesFragment,
  tabularSectionLineNumberFragment,
  commonAttributes,
  tabularSectionUuidFragment
)

export const MetadataChartOfAccountsTabularSectionRules = composeMetadataItemRule(
  metadataTabularSectionRuleBase,
  chartOfAccountsInternalInfo,
  tabularSectionIdentityFragment,
  tabularSectionPresentationFragment,
  tabularSectionFillCheckingFragment,
  tabularSectionStandardAttributesFragment,
  tabularSectionLineNumberFragment,
  commonAttributes,
  tabularSectionUuidFragment
)

export const MetadataChartOfCalculationTypesTabularSectionRules = composeMetadataItemRule(
  metadataTabularSectionRuleBase,
  chartOfCalculationTypesInternalInfo,
  tabularSectionIdentityFragment,
  tabularSectionPresentationFragment,
  tabularSectionFillCheckingFragment,
  tabularSectionStandardAttributesFragment,
  tabularSectionLineNumberFragment,
  commonAttributes,
  tabularSectionUuidFragment
)

export const MetadataChartOfCharacteristicTypesTabularSectionRules = composeMetadataItemRule(
  metadataTabularSectionRuleBase,
  chartOfCharacteristicTypesInternalInfo,
  tabularSectionIdentityFragment,
  tabularSectionPresentationFragment,
  tabularSectionFillCheckingFragment,
  tabularSectionStandardAttributesFragment,
  tabularSectionUseFragment,
  tabularSectionLineNumberFragment,
  commonAttributes,
  tabularSectionUuidFragment
)
