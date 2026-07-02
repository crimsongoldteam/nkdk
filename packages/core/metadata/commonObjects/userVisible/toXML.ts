import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import type { UserVisible, UserVisibleXML } from "./types"

export const exportUserVisibleToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  userVisible: UserVisible | undefined
): UserVisibleXML | undefined => {
  if (!userVisible) return undefined

  const result: UserVisibleXML = {
    "xr:Common": userVisible.common,
    "xr:Value": userVisible.values.map((item) => ({
      _name: item.name,
      "#text": item.value,
    })),
  }

  return result
}

registerTypeRule("UserVisible", "exportToXML", exportUserVisibleToXML)
