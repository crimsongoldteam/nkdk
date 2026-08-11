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

const systemEnumerations = new Map<string, RegisteredSystemEnumeration>()

export function registerSystemEnumeration(name: string, value: RegisteredSystemEnumeration): void {
  const registered = systemEnumerations.get(name)
  if (registered !== undefined && registered !== value) {
    throw new Error(`System enumeration ${name} is already registered`)
  }
  systemEnumerations.set(name, value)
}

export function getSystemEnumeration(name: string): RegisteredSystemEnumeration | undefined {
  return currentPropertyRuleRegistrySet<{
    getSystemEnumeration(name: string): RegisteredSystemEnumeration | undefined
  }>()?.getSystemEnumeration(name) ?? systemEnumerations.get(name)
}

export function getRegisteredSystemEnumerationNames(): string[] {
  return [...systemEnumerations.keys()].sort()
}
