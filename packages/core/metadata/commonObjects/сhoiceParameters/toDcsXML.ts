import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataValueToXML } from "../metadataValue/toXML"
import { MetadataValueByRule } from "../metadataValue/types"
import {
  ChoiceParameter,
  ChoiceParameterDcsItemXML,
  ChoiceParameterDcsValueRootXML,
} from "./types"

export const exportChoiceParameterToDcsXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  param: ChoiceParameter
): ChoiceParameterDcsValueRootXML => {
  const item: ChoiceParameterDcsItemXML = {
    "dcscor:choiceParameter": param.name,
  }

  if (param.value !== undefined) {
    const valueXml = exportMetadataValueToXML({
      context,
      rule: { type: "MetadataValue" },
      value: param.value as MetadataValueByRule<{ type: "MetadataValue" }>,
    })
    if (valueXml !== undefined) {
      item["dcscor:value"] = valueXml
    }
  }

  return {
    "dcscor:value": {
      "_xsi:type": "dcscor:ChoiceParameters",
      "dcscor:item": item,
    },
  }
}
