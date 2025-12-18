import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { BaseElement, BaseElementXML } from "./types"

export const exportBaseElementToXML = (
  data: BaseElement | undefined,
  _configurationSettings: ConfigurationSettings
): BaseElementXML | undefined => {
  if (!data) return undefined
  return {
    _id: data.id ?? "",
    _name: data.name,
  }
}
