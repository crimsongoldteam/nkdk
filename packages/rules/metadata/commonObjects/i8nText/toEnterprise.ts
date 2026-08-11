import { definePropertyTypeRule } from "../../ruleRuntime/property/propertyRuleRegistrySet"
import { ConfigurationContext } from "@nkdk/runtime"
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

export const metadataPropertyRule000 = definePropertyTypeRule("I8nText", "exportToEnterprise", exportI8nTextToEnterprise)
