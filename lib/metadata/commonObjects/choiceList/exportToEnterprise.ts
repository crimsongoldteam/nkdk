import { Context } from "../../context/types"
import { ChoiceList, ChoiceListEnterprise } from "./types"

export const exportChoiceListToEnterprise = (
  _configurationSettings: Context,
  data: ChoiceList | undefined
): ChoiceListEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}
