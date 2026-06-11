import { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import "./registerPropertyType"
import { exportI8nTextDefaultToYAML } from "./toYAML"
import { I8nText } from "./types"

export const exportI8nTextToEnterprise = (params: {
  context: ConfigurationContext
  value: I8nText | undefined
}): string | undefined => {
  const { context, value } = params
  if (!value) return undefined

  return exportI8nTextDefaultToYAML(context, value)
}

registerTypeRule("I8nText", "exportToEnterprise", exportI8nTextToEnterprise)
