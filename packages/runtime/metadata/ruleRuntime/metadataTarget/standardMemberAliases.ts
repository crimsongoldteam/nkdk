import { currentDataPathRegistrySet } from "../../validation/dataPath/dataPathExecutionContext"

export function standardMemberYamlToInternal(
  yamlName: string
): string | undefined {
  return currentDataPathRegistrySet<{
    getStandardMemberNamePairs(): readonly { readonly yaml: string; readonly internal: string }[]
  }>()?.getStandardMemberNamePairs().find((names) => names.yaml === yamlName)?.internal
}

export function standardMemberInternalToYaml(internalName: string): string | undefined {
  return currentDataPathRegistrySet<{
    getStandardMemberNamePairs(): readonly { readonly yaml: string; readonly internal: string }[]
  }>()?.getStandardMemberNamePairs().find((names) => names.internal === internalName)?.yaml
}

export function registeredStandardMemberAliases(): Readonly<Record<string, string>> {
  const pairs = currentDataPathRegistrySet<{
    getStandardMemberNamePairs(): readonly { readonly yaml: string; readonly internal: string }[]
  }>()?.getStandardMemberNamePairs() ?? []
  return Object.fromEntries(pairs.map(({ yaml, internal }) => [yaml, internal]))
}
