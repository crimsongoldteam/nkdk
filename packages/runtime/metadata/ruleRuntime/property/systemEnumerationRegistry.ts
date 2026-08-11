import { currentPropertyRuleRegistrySet } from "./propertyRuleExecutionContext"

export interface SystemEnumerationTypeMap {}

export type SystemEnumerationToMetadata<Name extends string> = Name extends keyof SystemEnumerationTypeMap
  ? SystemEnumerationTypeMap[Name] extends { metadata: infer Metadata }
    ? Metadata
    : unknown
  : unknown

export type SystemEnumerationToYAML<Name extends string> = Name extends keyof SystemEnumerationTypeMap
  ? SystemEnumerationTypeMap[Name] extends { yaml: infer YAML }
    ? YAML
    : unknown
  : unknown

export interface RegisteredSystemEnumeration {
  readonly fromYAML: Readonly<Record<string, string>>
  readonly toYAML: Readonly<Record<string, string>>
}

export function getSystemEnumeration(name: string): RegisteredSystemEnumeration | undefined {
  return currentPropertyRuleRegistrySet<{
    getSystemEnumeration(name: string): RegisteredSystemEnumeration | undefined
  }>()?.getSystemEnumeration(name)
}

export function getRegisteredSystemEnumerationNames(): string[] {
  return [...(
    currentPropertyRuleRegistrySet<{
      getSystemEnumerationNames(): readonly string[]
    }>()?.getSystemEnumerationNames() ?? []
  )].sort()
}
