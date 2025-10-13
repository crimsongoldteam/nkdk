import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { TNamedElement, TNamedElementXML } from "./types"
import { ImportFunction } from "~/lib/xml/import/types"

export const importNamedElementFromXML: ImportFunction<TNamedElement> = (xml: TNamedElementXML): TNamedElement => {
  const key = Object.keys(xml)[0]
  const element = xml[key]
  const result: TNamedElement = {
    name: element._name,
    id: element._id,
    type: key as ElementType,
  }
  return result
}
