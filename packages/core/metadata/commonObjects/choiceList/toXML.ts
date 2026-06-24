import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataValueToXML } from "../metadataValue/toXML"
import { MetadataFormChoiceListValueXML } from "../metadataValue/types"
import { ChoiceList, ChoiceListItemXML, ChoiceListXML } from "./types"

export const exportChoiceListToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  choiceList: ChoiceList | undefined
): ChoiceListXML | undefined => {
  if (!choiceList || choiceList.length === 0) return undefined

  const items: ChoiceListItemXML[] = choiceList.map((item) => ({
    ...(context.exportToXML ? { "xr:Presentation": "" } : undefined),
    "xr:CheckState": 0,
    "xr:Value": exportMetadataValueToXML({
      context,
      rule: { type: "MetadataValue" },
      value: item,
    })! as unknown as MetadataFormChoiceListValueXML,
  }))

  return {
    "xr:Item": items,
  }
}

registerTypeRule("ChoiceList", "exportToXML", exportChoiceListToXML)
