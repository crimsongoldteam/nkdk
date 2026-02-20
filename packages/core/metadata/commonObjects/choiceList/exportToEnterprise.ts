import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { exportFormChoiceListValueToYAML } from "../metadataValue/toYAML"
import { ChoiceList, ChoiceListYAML } from "./types"

export const exportChoiceListToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: ChoiceList | undefined
): ChoiceListYAML | undefined => {
  if (!data) return undefined

  return data.map((item) => exportFormChoiceListValueToYAML(context, undefined, item))
}

registerTypeRule("ChoiceList", "exportToYAML", exportChoiceListToYAML)
