import { ConfigurationSettings } from "../../configurationSettings/types"
import { exportMetadataFieldToEnterprise } from "../metadataField/exportToEnterprise"
import { ChoiceParameterLinks, ChoiceParameterLinksEnterprise } from "./types"

export const exportChoiceParameterLinksToEnterprise = (
  data: ChoiceParameterLinks | undefined,
  _configurationSettings: ConfigurationSettings
): ChoiceParameterLinksEnterprise | undefined => {
  if (!data) return undefined

  const result = []
  for (const link of data) {
    const dataPath = exportMetadataFieldToEnterprise(link.dataPath, _configurationSettings)
    const valueChangeParam = link.valueChange === "DontChange" ? ", НеИзменять" : ""
    result.push(`${link.name}(${dataPath}${valueChangeParam})`)
  }
  return result.join(", ")
}
