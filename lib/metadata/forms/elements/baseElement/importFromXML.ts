import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { FormElementType } from "../../../metadataFactory/types"
import { BaseElement, BaseElementXML } from "./types"

export const importBaseElementFromXML = (
  xml: BaseElementXML,
  _configurationSettings: ConfigurationSettings
): BaseElement => {
  return {
    name: xml._name,
    id: xml._id,
    elementType: FormElementType.BaseElement,
  }
}
