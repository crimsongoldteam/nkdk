import { ConfigurationContext } from "~/metadata/context/types"
import { FormattedI8nTextPropertyRule, PropertyRule } from "~/metadata/metadataFactory/elementRulesFactory"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { exportI8nTextToXML } from "../i8nText/exportToXML"
import { isEmptyI8nText } from "../i8nText/helper"
import { FormattedI8nText, FormattedI8nTextXML } from "./types"

export const exportFormattedI8nTextToXML = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  data: FormattedI8nText | undefined
): FormattedI8nTextXML | undefined => {
  if (!data) return undefined

  const formattedRule = rule as FormattedI8nTextPropertyRule<any>
  if (formattedRule.xmlWithDefaultLanguage && isEmptyI8nText(context, data) && !data.formatted) {
    return undefined
  }

  const v8Items = exportI8nTextToXML(context, rule, data)

  return { _formatted: data.formatted, ...v8Items }
}

registerTypeRule("FormattedI8nText", "exportToXML", exportFormattedI8nTextToXML)
