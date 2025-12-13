import { FormElementType } from "../types"
import { BaseElement, BaseElementXML } from "./types"

export const importBaseElementFromXML = (xml: BaseElementXML): BaseElement => {
  return {
    name: xml._name,
    id: xml._id ?? "",
    elementType: FormElementType.BaseElement,
  }
}
