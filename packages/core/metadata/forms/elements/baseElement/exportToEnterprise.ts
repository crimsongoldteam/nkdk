import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, BaseElementEnterprise } from "./types"

export const exportBaseElementToEnterprise = (
  _context: ConfigurationContext,
  _data: BaseElement | undefined
): BaseElementEnterprise | undefined => {
  return {}
}
