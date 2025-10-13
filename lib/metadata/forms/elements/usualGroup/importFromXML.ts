import importI8nXmlText from "~/lib/metadata/i8nText/importI8nTextFromXML"
import { TUsualGroupXML } from "./types"
import { TUsualGroup } from "./types"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { importElementFromXML } from "~/lib/xml/import/importerFactory"
import { TNamedElement } from "../element/types"
import { ImportFunction } from "~/lib/xml/import/types"

export const importUsualGroupFromXML: ImportFunction<TUsualGroup> = (xml: TUsualGroupXML): TUsualGroup => {
  const result: TUsualGroup = {
    type: ElementType.UsualGroup,
    name: xml.UsualGroup._name,
    id: xml.UsualGroup._id,
    title: importI8nXmlText(xml.UsualGroup.Title),
    group: xml.UsualGroup.Group,
    childItems:
      xml.UsualGroup.ChildItems && xml.UsualGroup.ChildItems !== ""
        ? xml.UsualGroup.ChildItems.map((item: any) => importElementFromXML(item) as unknown as TNamedElement)
        : [],
  }
  return result
}
