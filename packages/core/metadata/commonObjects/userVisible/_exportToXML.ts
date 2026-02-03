import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { UserVisible, UserVisibleXML } from "./types"

export const _exportUserVisibleToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  userVisible: UserVisible | undefined
): UserVisibleXML | undefined => {
  if (!userVisible) return undefined

  const result: UserVisibleXML = {
    "xr:Common": userVisible.common,
    "xr:Value": userVisible.values.map((item) => ({
      _name: `Role.${item.name}`,
      "#text": item.value,
    })),
  }

  return result
}
