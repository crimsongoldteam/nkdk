export const systemEnumerationXMLAliases = {
  CheckBoxType: {
    toXML: { Switch: "Switcher" },
    fromXML: { Switcher: "Switch" },
  },
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
