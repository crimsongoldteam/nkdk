export const systemEnumerationXMLAliases = {
  RadioButtonType: {
    toXML: { RadioButton: "RadioButtons" },
    fromXML: { RadioButtons: "RadioButton" },
  },
} as const

type AliasDirection = "toXML" | "fromXML"

export function applySystemEnumerationXMLAlias(
  type: string,
  direction: AliasDirection,
  value: string,
): string {
  const aliases = systemEnumerationXMLAliases as unknown as Record<
    string,
    Partial<Record<AliasDirection, Readonly<Record<string, string>>>>
  >
  return aliases[type]?.[direction]?.[value] ?? value
}
