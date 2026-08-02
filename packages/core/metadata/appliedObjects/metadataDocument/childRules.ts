import { Attribute, Tabular, composeMetadataItemRule, getParentFromContext, registerOwnerAttributeCollection, registerOwnerTabularSectionCollection } from "../ownerChildRules"

const tabularInternalInfo = Tabular.tabularSectionInternalInfoFragment({
  getName: ({ context, metadata }) => `${getParentFromContext(context, ["MetadataDocument"]).name}.${metadata.name}`,
  items: [{ name: "DocumentTabularSection", category: "TabularSection" }, { name: "DocumentTabularSectionRow", category: "TabularSectionRow" }],
})

export const MetadataDocumentAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({ allowedTypes: Attribute.METADATA_ATTRIBUTE_ALLOWED_TYPES }), Attribute.attributeFillFragment, Attribute.attributeChoiceFragment, Attribute.attributeSearchAndHistoryFragment, Attribute.attributeBinaryStorageUseFieldFragment, Attribute.attributeUuidFragment
)
export const MetadataDocumentTabularSectionAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({ allowedTypes: Attribute.METADATA_ATTRIBUTE_ALLOWED_TYPES }), Attribute.attributeChoiceFragment, Attribute.attributeSearchAndHistoryFragment, Attribute.attributeUuidFragment
)
export const MetadataDocumentTabularSectionRules = composeMetadataItemRule(
  Tabular.metadataTabularSectionRuleBase, tabularInternalInfo, Tabular.tabularSectionIdentityFragment, Tabular.tabularSectionPresentationFragment, Tabular.tabularSectionFillCheckingFragment, Tabular.tabularSectionStandardAttributesFragment, Tabular.tabularSectionLineNumberFragment, Tabular.tabularSectionAttributesFragment("MetadataDocumentTabularSectionAttributes"), Tabular.tabularSectionUuidFragment
)

registerOwnerAttributeCollection({ propertyType: "MetadataDocumentAttributes", schemaName: "MetadataDocumentAttribute", itemRule: MetadataDocumentAttributeRules })
registerOwnerAttributeCollection({ propertyType: "MetadataDocumentTabularSectionAttributes", schemaName: "MetadataDocumentTabularSectionAttribute", itemRule: MetadataDocumentTabularSectionAttributeRules })
registerOwnerTabularSectionCollection({ propertyType: "MetadataDocumentTabularSections", schemaName: "MetadataDocumentTabularSection", itemRule: MetadataDocumentTabularSectionRules })
