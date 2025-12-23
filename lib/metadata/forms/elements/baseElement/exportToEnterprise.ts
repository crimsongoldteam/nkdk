import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { BaseElement, BaseElementEnterprise } from "./types"

export const exportBaseElementToEnterprise = (
  _configurationSettings: ConfigurationSettings,
  _data: BaseElement | undefined
): BaseElementEnterprise | undefined => {
  return {}
}
