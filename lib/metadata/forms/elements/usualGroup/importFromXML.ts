import importI8nXmlText from "~/lib/metadata/i8nText/importI8nTextFromXML"
import { TUsualGroupXML } from "./types"
import { TUsualGroup } from "./types"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"

export default function importUsualGroupFromXML(xml: TUsualGroupXML): TUsualGroup {
  const result: TUsualGroup = {
    type: ElementType.UsualGroup,
    name: xml.UsualGroup._name,
    id: xml.UsualGroup._id,
    title: importI8nXmlText(xml.UsualGroup.Title),
    childItems: xml.UsualGroup.ChildItems && xml.UsualGroup.ChildItems !== "" ? xml.UsualGroup.ChildItems : [],
  }
  return result
}
