import { TElementType } from "~/lib/metadata/systemEnumerations/types"
import { TBaseElement, TBaseElementXML } from "./types"
import { ImportFunction } from "~/lib/xml/import/types"

export const importBaseElementFromXML: ImportFunction<TBaseElement> = (xml: TBaseElementXML): TBaseElement => {
  const key = Object.keys(xml)[0]
  const element = xml[key]
  const result: TBaseElement = {
    name: element._name,
    id: element._id,
    elementType: key as TElementType,
  }
  return result
}
