import { ConfigurationContext } from "../../context/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { exportI8nTextDefaultToYAML } from "../i8nText/toYAML"
import { FormattedI8nText } from "./types"

export const exportFormattedI8nTextToEnterprise = (params: {
  context: ConfigurationContext
  value: FormattedI8nText | undefined
}): string | undefined => {
  const { context, value } = params
  if (!value) return undefined

  return exportI8nTextDefaultToYAML(context, value)
}

export const metadataPropertyRule000 = definePropertyTypeRule("FormattedI8nText", "exportToEnterprise", exportFormattedI8nTextToEnterprise)
