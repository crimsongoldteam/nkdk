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

export function standardMemberInternalToYaml(internalName: string): string | undefined {
  for (const [yamlName, registeredInternalName] of internalNameByYaml) {
    if (registeredInternalName === internalName) return yamlName
  }
  return undefined
}

export function registeredStandardMemberAliases(): Readonly<Record<string, string>> {
  return Object.fromEntries(internalNameByYaml)
}

export function clearStandardMemberAliasesForTests(): void {
  internalNameByYaml.clear()
}
