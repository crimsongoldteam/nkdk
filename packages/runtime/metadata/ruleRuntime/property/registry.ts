/**
 * Neutral runtime key for a property-rule type.
 *
 * Concrete property behavior is declared next to the owning rules/builders and
 * connected to runtime behavior through registerTypeRule(...).
 */
export type PropertyRuleType = string

/**
 * Runtime-known property types are collected by propertyTypeKeys.ts through
 * local registrations. The central ruleRuntime layer must not import concrete
 * property implementations to build this list.
 */
export const PropertyRuleTypeKeys = [] as readonly PropertyRuleType[]

export interface PropertyMetadataTypeMap {}
export interface PropertyEnterpriseTypeMap {}
export interface PropertyYAMLTypeMap {}

type UnregisteredPropertyType<Key extends PropertyRuleType> = Key & any

export type PropertyToMetadata<Key extends PropertyRuleType> = Key extends keyof PropertyMetadataTypeMap
  ? PropertyMetadataTypeMap[Key]
  : UnregisteredPropertyType<Key>

export type PropertyToEnterprise<Key extends PropertyRuleType> = Key extends keyof PropertyEnterpriseTypeMap
  ? PropertyEnterpriseTypeMap[Key]
  : UnregisteredPropertyType<Key>

export type PropertyToYAML<Key extends PropertyRuleType> = Key extends keyof PropertyYAMLTypeMap
  ? PropertyYAMLTypeMap[Key]
  : UnregisteredPropertyType<Key>

export type {
  SystemEnumerationToMetadata,
  SystemEnumerationToYAML,
} from "./systemEnumerationRegistry"
