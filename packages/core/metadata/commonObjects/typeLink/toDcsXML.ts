import { PropertyRule } from "~/metadata/orchestration/property/types"
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
