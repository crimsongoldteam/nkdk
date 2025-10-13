import { TPictureDecoration, TPictureDecorationXML } from "./types"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import importPictureFromXML from "../../pictures/importFromXML"

export default function importPictureDecorationFromXML(xml: TPictureDecorationXML): TPictureDecoration {
  const result: TPictureDecoration = {
    name: xml.PictureDecoration._name,
    id: xml.PictureDecoration._id,
    picture: importPictureFromXML(xml.PictureDecoration.Picture),
    type: ElementType.PictureDecoration,
  }
  return result
}
