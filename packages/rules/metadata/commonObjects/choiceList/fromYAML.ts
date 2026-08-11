import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"
import { importFormChoiceListValueFromYAML } from "../metadataValue/fromYAML"
import type { ChoiceList, ChoiceListYAML } from "./types"

export const importChoiceListFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ChoiceListYAML | undefined
): ChoiceList | undefined => {
  if (!data) return undefined

  return data.map((item) => importFormChoiceListValueFromYAML(context, undefined, item))
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChoiceList", "importFromYAML", importChoiceListFromYAML)
