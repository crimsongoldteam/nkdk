import { Attribute, Tabular, composeMetadataItemRule, getParentFromContext } from "../ownerChildRules"

const tabularInternalInfo = Tabular.tabularSectionInternalInfoFragment({
  getName: ({ context, metadata }) => `${getParentFromContext(context, ["MetadataChartOfAccounts" as never]).name}.${metadata.name}`,
  items: [{ name: "ChartOfAccountsTabularSection", category: "TabularSection" }, { name: "ChartOfAccountsTabularSectionRow", category: "TabularSectionRow" }],
})

export const MetadataChartOfAccountsAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({}), Attribute.attributeFillFragment, Attribute.attributeChoiceFragment, Attribute.attributeSearchAndHistoryFragment, Attribute.attributeUuidFragment
)
export const MetadataChartOfAccountsTabularSectionAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({ allowedTypes: Attribute.METADATA_ATTRIBUTE_ALLOWED_TYPES }), Attribute.attributeChoiceFragment, Attribute.attributeSearchAndHistoryFragment, Attribute.attributeUuidFragment
)
export const MetadataChartOfAccountsTabularSectionRules = composeMetadataItemRule(
  Tabular.metadataTabularSectionRuleBase, tabularInternalInfo, Tabular.tabularSectionIdentityFragment, Tabular.tabularSectionPresentationFragment, Tabular.tabularSectionFillCheckingFragment, Tabular.tabularSectionStandardAttributesFragment, Tabular.tabularSectionLineNumberFragment, Tabular.tabularSectionAttributesFragment("MetadataChartOfAccountsTabularSectionAttributes", MetadataChartOfAccountsTabularSectionAttributeRules), Tabular.tabularSectionUuidFragment
)
