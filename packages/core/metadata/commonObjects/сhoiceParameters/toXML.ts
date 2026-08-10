import { definePropertyTypeRule } from "../../ruleRuntime/property/propertyRuleRegistrySet"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { ConfigurationContext } from "@nkdk/runtime"
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

export const metadataPropertyRule000 = definePropertyTypeRule("ChoiceParameters", "exportToXML", exportChoiceParametersToXML)
