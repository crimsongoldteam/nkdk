import { Attribute, Tabular, composeMetadataItemRule, getParentFromContext, registerOwnerAttributeCollection, registerOwnerTabularSectionCollection } from "../ownerChildRules"

const tabularInternalInfo = Tabular.tabularSectionInternalInfoFragment({
  getName: ({ context, metadata }) => `${getParentFromContext(context, ["MetadataTask"]).name}.${metadata.name}`,
  items: [{ name: "TaskTabularSection", category: "TabularSection" }, { name: "TaskTabularSectionRow", category: "TabularSectionRow" }],
})

export const MetadataTaskAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({}), Attribute.attributeFillFragment, Attribute.attributeChoiceFragment, Attribute.attributeSearchAndHistoryFragment, Attribute.attributeUuidFragment
)
export const MetadataTaskTabularSectionAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({ allowedTypes: Attribute.METADATA_ATTRIBUTE_ALLOWED_TYPES }), Attribute.attributeChoiceFragment, Attribute.attributeSearchAndHistoryFragment, Attribute.attributeUuidFragment
)
export const MetadataTaskTabularSectionRules = composeMetadataItemRule(
  Tabular.metadataTabularSectionRuleBase, tabularInternalInfo, Tabular.tabularSectionIdentityFragment, Tabular.tabularSectionPresentationFragment, Tabular.tabularSectionFillCheckingFragment, Tabular.tabularSectionStandardAttributesFragment, Tabular.tabularSectionLineNumberFragment, Tabular.tabularSectionAttributesFragment("MetadataTaskTabularSectionAttributes"), Tabular.tabularSectionUuidFragment
)

registerOwnerAttributeCollection({ propertyType: "MetadataTaskAttributes", schemaName: "MetadataTaskAttribute", itemRule: MetadataTaskAttributeRules })
registerOwnerAttributeCollection({ propertyType: "MetadataTaskTabularSectionAttributes", schemaName: "MetadataTaskTabularSectionAttribute", itemRule: MetadataTaskTabularSectionAttributeRules })
registerOwnerTabularSectionCollection({ propertyType: "MetadataTaskTabularSections", schemaName: "MetadataTaskTabularSection", itemRule: MetadataTaskTabularSectionRules })
