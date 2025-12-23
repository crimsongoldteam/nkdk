import { Context } from "../../context/types"
import { exportMetadataFieldToEnterprise } from "../metadataField/exportToEnterprise"
import { ChoiceParameterLinks, ChoiceParameterLinksEnterprise } from "./types"

export const exportChoiceParameterLinksToEnterprise = (
  _configurationSettings: Context,
  data: ChoiceParameterLinks | undefined
): ChoiceParameterLinksEnterprise | undefined => {
  if (!data) return undefined

  const result = []
  for (const link of data) {
    const dataPath = exportMetadataFieldToEnterprise(_configurationSettings, link.dataPath)
    const valueChangeParam = link.valueChange === "DontChange" ? ", НеИзменять" : ""
    result.push(`${link.name}(${dataPath}${valueChangeParam})`)
  }
  return result.join(", ")
}
