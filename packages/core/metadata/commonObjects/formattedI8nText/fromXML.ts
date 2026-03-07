import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { importBooleanFromXML } from "../boolean/fromXML"
import { importI8nTextFromXML } from "../i8nText/fromXML"
import { FormattedI8nText, FormattedI8nTextXML } from "./types"

export const importFormattedI8nTextFromXML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  xml: FormattedI8nTextXML | undefined
): FormattedI8nText | undefined => {
  if (xml === undefined) return undefined

  const resultI8nText = importI8nTextFromXML(context, rule, xml)

  if (resultI8nText === undefined) return undefined

  const formatted = importBooleanFromXML(context, undefined, xml._formatted) ?? false

  return {
    formatted: formatted,
    items: resultI8nText.items,
  }
}

registerTypeRule("FormattedI8nText", "importFromXML", importFormattedI8nTextFromXML)
