import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ConfigurationContext } from "../../context/types"
import {
  ChoiceParameterLink,
  ChoiceParameterLinkDcsItemXML,
  ChoiceParameterLinkDcsValueRootXML,
  ChoiceParameterLinks,
} from "./types"

const exportChoiceParameterLinkDcsItem = (link: ChoiceParameterLink): ChoiceParameterLinkDcsItemXML => ({
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
})

export const exportChoiceParameterLinksToDcsXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  links: ChoiceParameterLinks
): ChoiceParameterLinkDcsValueRootXML => {
  const items = links.map(exportChoiceParameterLinkDcsItem)
  return {
    "dcscor:value": {
      "_xsi:type": "dcscor:ChoiceParameterLinks",
      "dcscor:item": items.length === 1 ? items[0] : items,
    },
  }
}

export const exportChoiceParameterLinkToDcsXML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  link: ChoiceParameterLink
): ChoiceParameterLinkDcsValueRootXML => {
  return exportChoiceParameterLinksToDcsXML(context, rule, [link])
}
