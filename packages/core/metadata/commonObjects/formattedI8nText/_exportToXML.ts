import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { _exportI8nTextToXML } from "../i8nText/_exportToXML"
import { FormattedI8nText, FormattedI8nTextXML } from "./types"

export const _exportFormattedI8nTextToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: FormattedI8nText | undefined
): FormattedI8nTextXML | undefined => {
  if (!data) return undefined

  const v8Items = _exportI8nTextToXML(context, _rule, data)

  return { _formatted: data.formatted, ...v8Items }
}
