import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, BaseElementPropsEnterprise } from "./types"

export const exportBaseElementToEnterprise = (
  _context: ConfigurationContext,
  _data: BaseElement | undefined
): BaseElementPropsEnterprise | undefined => {
  return {}
}
