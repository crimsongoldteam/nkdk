import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { BaseElement, BaseElementEnterprise } from "./types"

export const exportBaseElementToEnterprise = (
  _data: BaseElement | undefined,
  _configurationSettings: ConfigurationSettings
): BaseElementEnterprise | undefined => {
  return {}
}
