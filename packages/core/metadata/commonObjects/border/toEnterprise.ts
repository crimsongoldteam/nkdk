import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { Border, BorderEnterprise } from "./types"

export const exportBorderToEnterprise = (params: { value: Border | undefined }): BorderEnterprise | undefined => {
  const { value } = params
  if (!value) return undefined

  const result: BorderEnterprise = {
    Type: "Border",
  }

  if (value.width !== undefined) {
    result.Width = value.width
  }
  if (value.controlBorderType !== undefined) {
    result.Value = `ControlBorderType.${value.controlBorderType}`
  }

  return result
}

registerTypeRule("Border", "exportToEnterprise", exportBorderToEnterprise)
