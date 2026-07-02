import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
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

registerTypeRule("ChoiceList", "exportToYAML", exportChoiceListToYAML)
