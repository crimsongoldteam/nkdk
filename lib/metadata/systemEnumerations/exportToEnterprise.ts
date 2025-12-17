export const exportSystemEnumerationToEnterprise = <T extends string>(
  value: string | undefined,
  enumeration: Record<string, string>
): T | undefined => {
  if (!value) return undefined

  return enumeration[value] as T
}
