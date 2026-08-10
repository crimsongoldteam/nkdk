import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { exportFormChoiceListValueToYAML } from "../metadataValue/toYAML"
import type { ChoiceList, ChoiceListYAML } from "./types"

export const exportChoiceListToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ChoiceList | undefined
): ChoiceListYAML | undefined => {
  if (!data) return undefined

  return data.map((item) => exportFormChoiceListValueToYAML(context, undefined, item))
}

export const metadataPropertyRule000 = definePropertyTypeRule("ChoiceList", "exportToYAML", exportChoiceListToYAML)
