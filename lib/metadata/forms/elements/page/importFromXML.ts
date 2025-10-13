import { TPage, TPageXML } from "./types"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { importElementFromXML } from "~/lib/xml/import/importerFactory"
import { TNamedElement } from "../element/types"
import { ImportFunction } from "~/lib/xml/import/types"

export const importPageFromXML: ImportFunction<TPage> = (xml: TPageXML): TPage => {
  const result: TPage = {
    type: ElementType.Page,
    name: xml.Page._name,
    id: xml.Page._id,
    childItems: xml.Page.ChildItems?.map((item: TNamedElement) => importElementFromXML(item)) ?? [],
  }
  return result
}
