import { ConfigurationSettings } from "../../configurationSettings/types"
import { ChoiceParameterLinks, ChoiceParameterLinksEnterprise } from "./types"

export const exportChoiceParameterLinksToEnterprise = (
  data: ChoiceParameterLinks | undefined,
  _configurationSettings: ConfigurationSettings
): ChoiceParameterLinksEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}
