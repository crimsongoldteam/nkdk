import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { _importBooleanFromXML } from "../boolean/_importFromXML"
import { _importI8nTextFromXML } from "../i8nText/_importFromXML"
import { FormattedI8nText, FormattedI8nTextXML } from "./types"

export const _importFormattedI8nTextFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: FormattedI8nTextXML | undefined
): FormattedI8nText | undefined => {
  if (xml === undefined) return undefined

  const resultI8nText = _importI8nTextFromXML(context, _rule, xml)

  if (resultI8nText === undefined) return undefined

  const formatted = _importBooleanFromXML(context, _rule, xml._formatted) ?? false

  return {
    formatted: formatted,
    items: resultI8nText.items,
  }
}
