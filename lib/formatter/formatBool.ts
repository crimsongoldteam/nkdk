export const formatBool = (value: boolean | undefined): string | undefined => {
  if (value === undefined) return undefined
  return value ? "Истина" : "Ложь"
}
