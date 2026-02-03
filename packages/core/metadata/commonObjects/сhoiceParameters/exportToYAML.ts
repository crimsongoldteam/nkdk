import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataValueToYAML } from "../metadataValue/exportToYAML"
import { ChoiceParameters, ChoiceParametersEnterprise } from "./types"

export const exportChoiceParametersToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ChoiceParameters | undefined
): ChoiceParametersEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((param) => [param.name, exportMetadataValueToYAML(context, undefined, _rule, param.value)])
  )
}
