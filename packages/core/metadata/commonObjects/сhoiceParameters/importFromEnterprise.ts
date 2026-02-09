import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { importMetadataValueFromEnterprise } from "../metadataValue/importFromEnterprise"
import { ChoiceParameters, ChoiceParametersEnterprise } from "./types"

export const importChoiceParametersFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: ChoiceParametersEnterprise | undefined
): ChoiceParameters | undefined => {
  if (!data) return undefined

  return Object.entries(data).map(([name, value]) => ({
    name,
    value: importMetadataValueFromEnterprise(context, undefined, value),
  }))
}

registerTypeRule("ChoiceParameters", "importFromEnterprise", importChoiceParametersFromEnterprise)
