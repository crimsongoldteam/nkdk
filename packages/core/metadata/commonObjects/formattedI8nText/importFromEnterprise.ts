import { ConfigurationContext } from "~/metadata/context/types"
import { importI8nTextFromEnterprise } from "../i8nText/importFromEnterprise"
import { FormattedI8nText, FormattedI8nTextEnterprise } from "./types"

export const importFormattedI8nTextFromEnterprise = (
  context: ConfigurationContext,
  text: FormattedI8nTextEnterprise | undefined,
  formattedText: FormattedI8nTextEnterprise | undefined
): FormattedI8nText | undefined => {
  if (text === undefined && formattedText === undefined) return undefined

  const textValue = formattedText ? formattedText : text
  const textResult = importI8nTextFromEnterprise(context, textValue)!

  const result: FormattedI8nText = {
    formatted: formattedText !== undefined,
    items: textResult.items,
  }

  return result
}
