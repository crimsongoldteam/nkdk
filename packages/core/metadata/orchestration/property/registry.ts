/**
 * Neutral runtime key for a property-rule type.
 *
 * Concrete property behavior is declared next to the owning rules/builders and
 * connected to runtime behavior through registerTypeRule(...).
 */
export type PropertyRuleType = string

/**
 * Runtime-known property types are collected by propertyTypeKeys.ts through
 * local registrations. The central orchestration layer must not import concrete
 * property implementations to build this list.
 */
export const PropertyRuleTypeKeys = [] as readonly PropertyRuleType[]

export type PropertyToMetadata<Key extends PropertyRuleType> = Key & any
export type PropertyToEnterprise<Key extends PropertyRuleType> = Key & any
export type PropertyToYAML<Key extends PropertyRuleType> = Key & any
