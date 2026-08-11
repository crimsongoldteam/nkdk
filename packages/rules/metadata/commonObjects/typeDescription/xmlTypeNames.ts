const IMPORTED_TYPE_DESCRIPTION_ALIASES: Readonly<Record<string, string>> = {
  AnyRef: "AnyIBRef",
}

export function normalizeImportedTypeDescriptionName(type: string): string {
  return IMPORTED_TYPE_DESCRIPTION_ALIASES[type] ?? type
}
