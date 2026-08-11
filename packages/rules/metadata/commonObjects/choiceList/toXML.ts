import { definePropertyTypeRule } from "../../ruleRuntime/property/propertyRuleRegistrySet"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { ConfigurationContext } from "@nkdk/runtime"
import { exportMetadataValueToXML } from "../metadataValue/toXML"
import { MetadataFormChoiceListValueXML } from "../metadataValue/types"
import type { ChoiceList, ChoiceListItemXML, ChoiceListXML } from "./types"

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

export const metadataPropertyRule000 = definePropertyTypeRule("ChoiceList", "exportToXML", exportChoiceListToXML)
