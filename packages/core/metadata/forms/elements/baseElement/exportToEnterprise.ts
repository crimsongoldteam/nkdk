import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElementPropsEnterprise, NamedElement } from "./types"

export const exportBaseElementToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  _data: NamedElement | undefined
): BaseElementPropsEnterprise | undefined => {
  return {}
}
