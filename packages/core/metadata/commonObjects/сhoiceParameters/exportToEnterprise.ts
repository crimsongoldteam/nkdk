import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataValueToEnterprise } from "../metadataValue/exportToEnterprise"
import { ChoiceParameters, ChoiceParametersEnterprise } from "./types"

export const exportChoiceParametersToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: ChoiceParameters | undefined
): ChoiceParametersEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((param) => [param.name, exportMetadataValueToEnterprise(context, undefined, param.value)])
  )
}

registerTypeRule("ChoiceParameters", "exportToEnterprise", exportChoiceParametersToEnterprise)
