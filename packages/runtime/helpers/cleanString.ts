export const cleanString = (input: string | undefined, removeWhitespace: boolean = true): string | undefined => {
  if (!input || typeof input !== "string") return undefined

  const regexp = removeWhitespace ? /[^a-zA-Zа-яА-Я0-9_]/g : /[^a-zA-Zа-яА-Я0-9_ \t]/g
  const cleaned = input.replace(regexp, "")

  return cleaned
}
