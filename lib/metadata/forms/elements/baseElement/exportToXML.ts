import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { BaseElement, BaseElementXML } from "./types"

export const exportBaseElementToXML = (
  _configurationSettings: ConfigurationSettings,
  data: BaseElement | undefined
): BaseElementXML | undefined => {
  if (!data) return undefined
  return {
    _id: data.id ?? "",
    _name: data.name,
  }
}
