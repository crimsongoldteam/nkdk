import { Context } from "~/lib/metadata/context/types"
import { BaseElement, BaseElementEnterprise } from "./types"

export const exportBaseElementToEnterprise = (
  _configurationSettings: Context,
  _data: BaseElement | undefined
): BaseElementEnterprise | undefined => {
  return {}
}
