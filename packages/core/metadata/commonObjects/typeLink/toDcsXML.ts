import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { TypeLink, TypeLinkDcsValueRootXML } from "./types"

export const exportToDcsXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  typeLink: TypeLink
): TypeLinkDcsValueRootXML => {
  return {
    "dcscor:value": {
      "_xsi:type": "dcscor:TypeLink",
      "dcscor:field": typeLink.dataPath,
      "dcscor:linkItem": Number(typeLink.linkItem),
    },
  }
}
