const internalNameByYaml = new Map<string, string>()

export function registerStandardMemberAlias(
  yamlName: string,
  internalName: string
): void {
  if (!internalNameByYaml.has(yamlName)) {
    internalNameByYaml.set(yamlName, internalName)
  }
}

export function standardMemberYamlToInternal(
  yamlName: string
): string | undefined {
  return internalNameByYaml.get(yamlName)
}

export function clearStandardMemberAliasesForTests(): void {
  internalNameByYaml.clear()
}
