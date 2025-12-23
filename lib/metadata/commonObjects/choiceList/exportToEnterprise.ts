import { ConfigurationSettings } from "../../configurationSettings/types"
import { ChoiceList, ChoiceListEnterprise } from "./types"

export const exportChoiceListToEnterprise = (
  _configurationSettings: ConfigurationSettings,
  data: ChoiceList | undefined
): ChoiceListEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}
