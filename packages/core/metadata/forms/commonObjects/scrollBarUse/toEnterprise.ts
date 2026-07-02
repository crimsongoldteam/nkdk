import { ConfigurationContext } from "../../../context/types"
import { registerTypeRule } from "../../../orchestration"
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

registerTypeRule("ScrollBarUseBoolean", "exportToEnterprise", exportScrollBarUseToEnterprise as any)
