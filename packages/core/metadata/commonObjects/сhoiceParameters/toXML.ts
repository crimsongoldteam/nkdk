import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataValueToXML } from "../metadataValue/toXML"
import type { ChoiceParameters, ChoiceParametersXML } from "./types"

export const exportChoiceParametersToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  parameters: ChoiceParameters | undefined
): ChoiceParametersXML | undefined => {
  if (!parameters || parameters.length === 0) return undefined

  const items = parameters.map((param) => ({
    _name: param.name,
    "app:value": exportMetadataValueToXML({
      context,
      rule: { type: "MetadataValue", exportNilValue: true },
      value: param.value,
    })!,
  }))

  return {
    "app:item": items,
  }
}

registerTypeRule("ChoiceParameters", "exportToXML", exportChoiceParametersToXML)
