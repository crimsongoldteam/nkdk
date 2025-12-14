export const formatSystemEnumeration = (
  value: string | undefined,
  enumeration: Record<string, string>
): string | undefined => {
  if (!value) return undefined

  return enumeration[value]
}
