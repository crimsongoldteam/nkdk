import { type TUse } from "./types"
import { formatBool } from "~/lib/formatter/formatBool"

export function formatUse(use: TUse): string {
  const header = use.common ? "РазрешитьИспользование:" : "ЗапретитьИспользование:"

  const formattedValues = use.values
    .map((item) => {
      const value = formatBool(item.value)
      return `  - ${item.name}: ${value}`
    })
    .join("\n")

  return `${header}\n${formattedValues}`
}
