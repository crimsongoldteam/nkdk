import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { importFormChoiceListValueFromXML } from "../metadataValue/fromXML"
import type { ChoiceList, ChoiceListXML } from "./types"
import { ConfigurationContextFromXML } from "@nkdk/runtime"

export const importChoiceListFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: ChoiceListXML | undefined
): ChoiceList | undefined => {
  if (!xml || !xml["xr:Item"]) return undefined

  const xrItem = xml["xr:Item"]

  const items = Array.isArray(xrItem) ? xrItem : [xrItem]

  const result = items.map((item) => {
    return importFormChoiceListValueFromXML(context, undefined, item["xr:Value"])!
  })

  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChoiceList", "importFromXML", importChoiceListFromXML)
