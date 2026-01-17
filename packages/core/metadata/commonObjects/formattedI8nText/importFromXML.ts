import { ConfigurationContext } from "../../context/types"
import { importBooleanFromXML } from "../boolean/importFromXML"
import { importI8nTextFromXML } from "../i8nText/importFromXML"
import { FormattedI8nText, FormattedI8nTextXML } from "./types"

export const importFormattedI8nTextFromXML = (
  context: ConfigurationContext,
  xml: FormattedI8nTextXML | undefined
): FormattedI8nText | undefined => {
  if (xml === undefined) return undefined

  const resultI8nText = importI8nTextFromXML(context, xml)

  if (resultI8nText === undefined) return undefined

  const formatted = importBooleanFromXML(context, xml._formatted) ?? false

  return {
    formatted: formatted,
    items: resultI8nText.items,
  }
}
