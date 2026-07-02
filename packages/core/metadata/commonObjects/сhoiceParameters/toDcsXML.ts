import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataValueToXML } from "../metadataValue/toXML"
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
      value: param.value,
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
