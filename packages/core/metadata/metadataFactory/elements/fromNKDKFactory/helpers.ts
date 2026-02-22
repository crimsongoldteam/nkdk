import { FormattedI8nText } from "~/metadata/commonObjects/formattedI8nText/types"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { I8nText } from "~/metadata/commonObjects/i8nText/types"
import { ConfigurationContext } from "~/metadata/context/types"

export const importNameFromNKDK = (name: string | undefined): string => {
  if (name == null) return ""
  return name.startsWith("%") ? name.slice(1) : name
}

export const importI8nTextFromNKDK = (
  context: ConfigurationContext,
  value: string | undefined
): I8nText | undefined => {
  const result = importI8nTextFromString({ context, value, trim: true })
  if (result === undefined) return undefined
  return result
}

export const importFormattedI8nTextFromNKDK = (
  context: ConfigurationContext,
  value: string | undefined
): FormattedI8nText | undefined => {
  const result = importI8nTextFromString({ context, value })
  if (result === undefined) return undefined
  return { formatted: false, items: result.items }
}
