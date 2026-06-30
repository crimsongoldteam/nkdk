/**
 * Neutral runtime key for a metadata item type.
 *
 * Concrete metadata models are inferred next to their rules with
 * MetadataTypeByRule<typeof Rules> and YAMLTypeByRule<typeof Rules>.
 */
export type MetadataItemType = string

/**
 * Compatibility aliases for generic orchestration code that still receives only
 * itemType strings. New object-local code should prefer MetadataTypeByRule and
 * YAMLTypeByRule from a concrete rules.ts.
 */
export type ToYAML<T extends MetadataItemType> = T & any
export type ToMetadata<T extends MetadataItemType> = T & any
export type EnterpriseExportableMetadataType = MetadataItemType
export type ToEnterprise<T extends EnterpriseExportableMetadataType> = T & any
export type ToTypedYAML<T extends MetadataItemType> = T & any
