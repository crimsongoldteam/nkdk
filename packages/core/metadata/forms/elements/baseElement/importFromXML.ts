import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementType } from "../../../metadataFactory/types"
import { BaseElement, BaseElementXML } from "./types"

export const importBaseElementFromXML = (_context: ConfigurationContext, xml: BaseElementXML): BaseElement => {
  return {
    name: xml._name,
    elementType: FormElementType.BaseElement,
  }
}
