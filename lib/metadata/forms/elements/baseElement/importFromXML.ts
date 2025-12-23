import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { FormElementType } from "../../../metadataFactory/types"
import { BaseElement, BaseElementXML } from "./types"

export const importBaseElementFromXML = (
  _configurationSettings: ConfigurationSettings,
  xml: BaseElementXML
): BaseElement => {
  return {
    name: xml._name,
    id: xml._id,
    elementType: FormElementType.BaseElement,
  }
}
