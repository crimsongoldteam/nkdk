import { TLabelDecoration, TLabelDecorationXML } from "./types"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import importI8nTextFromXML from "~/lib/metadata/i8nText/importI8nTextFromXML"

export default function importLabelDecorationFromXML(xml: TLabelDecorationXML): TLabelDecoration {
  const result: TLabelDecoration = {
    name: xml.LabelDecoration._name,
    id: xml.LabelDecoration._id,
    title: importI8nTextFromXML(xml.LabelDecoration.Title),
    type: ElementType.LabelDecoration,
  }
  return result
}
