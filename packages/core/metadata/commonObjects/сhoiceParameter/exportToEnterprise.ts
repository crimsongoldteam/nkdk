import { Context } from "../../context/types"
import { exportMetadataValueToEnterprise } from "../metadataValue/exportToEnterprise"
import { ChoiceParameterLinksEnterprise } from "../сhoiceParameterLinks/types"
import { ChoiceParameters } from "./types"

export const exportChoiceParameterLinksToEnterprise = (
  context: Context,
  data: ChoiceParameters | undefined
): ChoiceParameterLinksEnterprise | undefined => {
  if (!data) return undefined

  const result = []
  for (const param of data) {
    const exportedValue = exportMetadataValueToEnterprise(context, param.value)
    const valueStr = Array.isArray(exportedValue) ? exportedValue.join(", ") : exportedValue
    result.push(`${param.name}(${valueStr})`)
  }
  return result.join(", ")
}
