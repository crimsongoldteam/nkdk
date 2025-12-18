import { ConfigurationSettings } from "../../configurationSettings/types"
import { ChoiceList, ChoiceListEnterprise } from "./types"

export const exportChoiceListToEnterprise = (
  data: ChoiceList | undefined,
  _configurationSettings: ConfigurationSettings
): ChoiceListEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}
