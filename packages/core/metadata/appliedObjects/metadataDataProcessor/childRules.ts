import { Attribute, Tabular, composeMetadataItemRule, getParentFromContext, registerOwnerAttributeCollection, registerOwnerTabularSectionCollection } from "../ownerChildRules"

const tabularInternalInfo = Tabular.tabularSectionInternalInfoFragment({
  getName: ({ context, metadata }) => `${getParentFromContext(context, ["MetadataDataProcessor"]).name}.${metadata.name}`,
  items: [{ name: "DataProcessorTabularSection", category: "TabularSection" }, { name: "DataProcessorTabularSectionRow", category: "TabularSectionRow" }],
})

export const MetadataDataProcessorAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({}), Attribute.attributeChoiceFragment, Attribute.attributeUuidFragment
)
export const MetadataDataProcessorTabularSectionAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({ allowedTypes: Attribute.METADATA_ATTRIBUTE_ALLOWED_TYPES }), Attribute.attributeFillFragment, Attribute.attributeChoiceFragment, Attribute.attributeUuidFragment
)
export const MetadataDataProcessorTabularSectionRules = composeMetadataItemRule(
  Tabular.metadataTabularSectionRuleBase, tabularInternalInfo, Tabular.tabularSectionIdentityFragment, Tabular.tabularSectionPresentationFragment, Tabular.tabularSectionFillCheckingFragment, Tabular.tabularSectionStandardAttributesFragment, Tabular.tabularSectionAttributesFragment("MetadataDataProcessorTabularSectionAttributes"), Tabular.tabularSectionUuidFragment
)

registerOwnerAttributeCollection({ propertyType: "MetadataDataProcessorAttributes", schemaName: "MetadataDataProcessorAttribute", itemRule: MetadataDataProcessorAttributeRules })
registerOwnerAttributeCollection({ propertyType: "MetadataDataProcessorTabularSectionAttributes", schemaName: "MetadataDataProcessorTabularSectionAttribute", itemRule: MetadataDataProcessorTabularSectionAttributeRules })
registerOwnerTabularSectionCollection({ propertyType: "MetadataDataProcessorTabularSections", schemaName: "MetadataDataProcessorTabularSection", itemRule: MetadataDataProcessorTabularSectionRules })
