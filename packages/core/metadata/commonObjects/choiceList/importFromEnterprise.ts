import { ConfigurationContext } from "../../context/types"
import { importFormChoiceListValueFromEnterprise } from "../metadataValue/importFromEnterprise"
import { ChoiceList, ChoiceListEnterprise } from "./types"

export const importChoiceListFromEnterprise = (
  context: ConfigurationContext,
  data: ChoiceListEnterprise | undefined
): ChoiceList | undefined => {
  if (!data) return undefined

  return data.map((item) => importFormChoiceListValueFromEnterprise(context, item))
}
