import { TBaseElement, TBaseElementXML } from "./types"
import { ZElementType } from "../types"

export const importBaseElementFromXML = (xml: TBaseElementXML | undefined): TBaseElement | undefined => {
  if (!xml) return undefined
  return {
    name: xml._name,
    id: xml._id,
    elementType: ZElementType.enum.BaseElement,
  }
}
