import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElementPropsEnterprise, NamedElement } from "./types"
import { PropertyRule } from "../calendarField/rules"

export const exportBaseElementToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  _data: NamedElement | undefined
): BaseElementPropsEnterprise | undefined => {
  return {}
}
