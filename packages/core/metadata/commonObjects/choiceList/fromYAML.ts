import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
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

registerTypeRule("ChoiceList", "importFromYAML", importChoiceListFromYAML)
