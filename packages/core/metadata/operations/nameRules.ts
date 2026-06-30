const metadataNameRegExp = /^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*$/

export function validateMetadataLocalName(name: string): { ok: true } | { ok: false; message: string } {
  if (!metadataNameRegExp.test(name)) {
    return {
      ok: false,
      message: "Имя должно начинаться с буквы или _, дальше допустимы буквы, цифры и _",
    }
  }
  return { ok: true }
}

export function sameNameIgnoreCase(left: string, right: string): boolean {
  return left.localeCompare(right, "ru", { sensitivity: "accent" }) === 0
}

export function hasCaseInsensitiveConflict(params: {
  existingNames: readonly string[]
  currentName: string
  nextName: string
}): boolean {
  if (sameNameIgnoreCase(params.currentName, params.nextName)) return false
  return params.existingNames.some((name) => sameNameIgnoreCase(name, params.nextName))
}
