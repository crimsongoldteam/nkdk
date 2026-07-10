import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { importBooleanFromXML } from "../boolean/fromXML"
import { importI8nTextFromXML } from "../i8nText/fromXML"
import type { FormattedI8nText, FormattedI8nTextXML } from "./types"
import { ConfigurationContextFromXML } from "../../context/types"

export const importFormattedI8nTextFromXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  xml: FormattedI8nTextXML | undefined
): FormattedI8nText | undefined => {
  if (xml === undefined) return undefined

  const formatted = importBooleanFromXML(context, undefined, xml._formatted) ?? false
  const resultI8nText = importI8nTextFromXML(context, rule, xml)

  if (resultI8nText === undefined) {
    if (xml._formatted === undefined) return undefined
    return {
      formatted,
      items: {},
    }
  }

  return {
    formatted,
    items: resultI8nText.items,
  }
}

registerTypeRule("FormattedI8nText", "importFromXML", importFormattedI8nTextFromXML)
