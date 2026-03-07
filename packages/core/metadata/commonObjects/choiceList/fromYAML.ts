import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { importFormChoiceListValueFromYAML } from "../metadataValue/fromYAML"
import { ChoiceList, ChoiceListYAML } from "./types"

export const importChoiceListFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ChoiceListYAML | undefined
): ChoiceList | undefined => {
  if (!data) return undefined

  return data.map((item) => importFormChoiceListValueFromYAML(context, undefined, item))
}

registerTypeRule("ChoiceList", "importFromYAML", importChoiceListFromYAML)
