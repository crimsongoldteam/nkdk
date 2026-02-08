import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { exportFormChoiceListValueToEnterprise } from "../metadataValue/exportToEnterprise"
import { ChoiceList, ChoiceListEnterprise } from "./types"

export const exportChoiceListToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: ChoiceList | undefined
): ChoiceListEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportFormChoiceListValueToEnterprise(context, undefined, item))
}
