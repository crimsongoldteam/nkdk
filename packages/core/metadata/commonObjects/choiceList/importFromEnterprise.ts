import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { importFormChoiceListValueFromEnterprise } from "../metadataValue/importFromEnterprise"
import { ChoiceList, ChoiceListEnterprise } from "./types"
import { registerTypeRule } from "~/metadata/metadataFactory"

export const importChoiceListFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: ChoiceListEnterprise | undefined
): ChoiceList | undefined => {
  if (!data) return undefined

  return data.map((item) => importFormChoiceListValueFromEnterprise(context, undefined, item))
}

registerTypeRule("ChoiceList", "importFromEnterprise", importChoiceListFromEnterprise)
