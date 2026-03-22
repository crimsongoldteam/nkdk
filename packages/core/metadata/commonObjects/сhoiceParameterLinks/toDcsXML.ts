import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import {
  ChoiceParameterLink,
  ChoiceParameterLinkDcsItemXML,
  ChoiceParameterLinkDcsValueRootXML,
} from "./types"

export const exportChoiceParameterLinkToDcsXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  link: ChoiceParameterLink
): ChoiceParameterLinkDcsValueRootXML => {
  const item: ChoiceParameterLinkDcsItemXML = {
    "dcscor:choiceParameter": link.name,
    "dcscor:value": link.dataPath,
    ...(link.valueChange !== undefined
      ? {
          "dcscor:mode": {
            "_xsi:type": "ent:LinkedValueChangeMode" as const,
            "#text": link.valueChange,
          },
        }
      : {}),
  }

  return {
    "dcscor:value": {
      "_xsi:type": "dcscor:ChoiceParameterLinks",
      "dcscor:item": item,
    },
  }
}
