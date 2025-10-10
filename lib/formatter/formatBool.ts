export const formatBool = (value: boolean | undefined): "Истина" | "Ложь" | undefined => {
  if (value === undefined) return undefined
  return value ? "Истина" : "Ложь"
}
