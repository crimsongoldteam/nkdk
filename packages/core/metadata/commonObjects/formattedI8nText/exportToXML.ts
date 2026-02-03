import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportI8nTextToXML } from "../i8nText/exportToXML"
import { isEmptyI8nText } from "../i8nText/helper"
import { FormattedI8nText, FormattedI8nTextXML } from "./types"

export const exportFormattedI8nTextToXMLWithDefaultLanguage = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FormattedI8nText | undefined
): FormattedI8nTextXML | undefined => {
  if (!data) return undefined

  if (isEmptyI8nText(context, data) && !data.formatted) {
    return undefined
  }

  return exportFormattedI8nTextToXML(context, undefined, data)
}

export const exportFormattedI8nTextToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FormattedI8nText | undefined
): FormattedI8nTextXML | undefined => {
  if (!data) return undefined

  const v8Items = exportI8nTextToXML(context, undefined, data)

  return { _formatted: data.formatted, ...v8Items }
}
