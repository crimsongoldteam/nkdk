import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "../calendarField/rules"
import { BaseElementPropsEnterprise, NamedElement } from "./types"

export const exportBaseElementToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
  _data: NamedElement | undefined
): BaseElementPropsEnterprise | undefined => {
  return {}
}
