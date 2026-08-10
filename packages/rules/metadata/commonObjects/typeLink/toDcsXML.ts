import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { ConfigurationContext } from "@nkdk/runtime"
import type { TypeLink, TypeLinkDcsValueRootXML } from "./types"

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
