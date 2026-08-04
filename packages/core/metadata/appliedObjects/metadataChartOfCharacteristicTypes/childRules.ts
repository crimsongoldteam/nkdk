import { Attribute, Tabular, composeMetadataItemRule, getParentFromContext } from "../ownerChildRules"
import { metadataRuleFragment } from "../../commonObjects/metadataRuleFragment"

const chartOfCharacteristicTypesAttributeSearchUseAndHistoryFragment = metadataRuleFragment(
  ["indexing", "use", "fullTextSearch", "dataHistory"],
  {
    indexing: Attribute.attributeSearchAndHistoryFragment.properties.indexing,
    use: Attribute.attributeUseFragment.properties.use,
    fullTextSearch: Attribute.attributeSearchAndHistoryFragment.properties.fullTextSearch,
    dataHistory: Attribute.attributeSearchAndHistoryFragment.properties.dataHistory,
  }
)

const tabularInternalInfo = Tabular.tabularSectionInternalInfoFragment({
  getName: ({ context, metadata }) => `${getParentFromContext(context, ["MetadataChartOfCharacteristicTypes" as never]).name}.${metadata.name}`,
  items: [{ name: "ChartOfCharacteristicTypesTabularSection", category: "TabularSection" }, { name: "ChartOfCharacteristicTypesTabularSectionRow", category: "TabularSectionRow" }],
})

export const MetadataChartOfCharacteristicTypesAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({ allowedTypes: Attribute.METADATA_ATTRIBUTE_ALLOWED_TYPES }), Attribute.attributeFillFragment, Attribute.attributeChoiceFragment, chartOfCharacteristicTypesAttributeSearchUseAndHistoryFragment, Attribute.attributeUuidFragment
)
export const MetadataChartOfCharacteristicTypesTabularSectionAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({ allowedTypes: Attribute.METADATA_ATTRIBUTE_ALLOWED_TYPES }), Attribute.attributeChoiceFragment, Attribute.attributeSearchAndHistoryFragment, Attribute.attributeUuidFragment
)
export const MetadataChartOfCharacteristicTypesTabularSectionRules = composeMetadataItemRule(
  Tabular.metadataTabularSectionRuleBase, tabularInternalInfo, Tabular.tabularSectionIdentityFragment, Tabular.tabularSectionPresentationFragment, Tabular.tabularSectionFillCheckingFragment, Tabular.tabularSectionStandardAttributesFragment, Tabular.tabularSectionUseFragment, Tabular.tabularSectionLineNumberFragment, Tabular.tabularSectionAttributesFragment("MetadataChartOfCharacteristicTypesTabularSectionAttributes", MetadataChartOfCharacteristicTypesTabularSectionAttributeRules), Tabular.tabularSectionUuidFragment
)
