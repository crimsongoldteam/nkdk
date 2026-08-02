import { Attribute, Tabular, composeMetadataItemRule, getParentFromContext, registerOwnerAttributeCollection, registerOwnerTabularSectionCollection } from "../ownerChildRules"

const tabularInternalInfo = Tabular.tabularSectionInternalInfoFragment({
  getName: ({ context, metadata }) => `${getParentFromContext(context, ["MetadataReport"]).name}.${metadata.name}`,
  items: [{ name: "ReportTabularSection", category: "TabularSection" }, { name: "ReportTabularSectionRow", category: "TabularSectionRow" }],
})

export const MetadataReportAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({}), Attribute.attributeChoiceFragment, Attribute.attributeUuidFragment
)
export const MetadataReportTabularSectionAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({ allowedTypes: Attribute.METADATA_ATTRIBUTE_ALLOWED_TYPES }), Attribute.attributeFillFragment, Attribute.attributeChoiceFragment, Attribute.attributeUuidFragment
)
export const MetadataReportTabularSectionRules = composeMetadataItemRule(
  Tabular.metadataTabularSectionRuleBase, tabularInternalInfo, Tabular.tabularSectionIdentityFragment, Tabular.tabularSectionPresentationFragment, Tabular.tabularSectionFillCheckingFragment, Tabular.tabularSectionStandardAttributesFragment, Tabular.tabularSectionAttributesFragment("MetadataReportTabularSectionAttributes"), Tabular.tabularSectionUuidFragment
)

registerOwnerAttributeCollection({ propertyType: "MetadataReportAttributes", schemaName: "MetadataReportAttribute", itemRule: MetadataReportAttributeRules })
registerOwnerAttributeCollection({ propertyType: "MetadataReportTabularSectionAttributes", schemaName: "MetadataReportTabularSectionAttribute", itemRule: MetadataReportTabularSectionAttributeRules })
registerOwnerTabularSectionCollection({ propertyType: "MetadataReportTabularSections", schemaName: "MetadataReportTabularSection", itemRule: MetadataReportTabularSectionRules })
