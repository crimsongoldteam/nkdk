import { Context } from "~/metadata/context/types"
import { FormElementType } from "../../../metadataFactory/types"
import { BaseElement, BaseElementXML } from "./types"

export const importBaseElementFromXML = (_context: Context, xml: BaseElementXML): BaseElement => {
  return {
    name: xml._name,
    id: xml._id,
    elementType: FormElementType.BaseElement,
  }
}
