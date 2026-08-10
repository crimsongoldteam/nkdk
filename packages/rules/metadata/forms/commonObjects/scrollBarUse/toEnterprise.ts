import { ConfigurationContext } from "@nkdk/runtime"
import { definePropertyTypeRule } from "../../../ruleRuntime"
import { ScrollBarUse, ScrollBarUseEnterprise } from "./types"

export const exportScrollBarUseToEnterprise = (params: {
  context: ConfigurationContext
  value: ScrollBarUse | undefined
}): ScrollBarUseEnterprise | undefined => {
  const { value } = params

  if (!value) return undefined

  return {
    Type: "SystemEnumeration",
    Value: `ScrollBarUse.${value}`,
  }
}

export const metadataPropertyRule000 = definePropertyTypeRule("ScrollBarUseBoolean", "exportToEnterprise", exportScrollBarUseToEnterprise as any)
