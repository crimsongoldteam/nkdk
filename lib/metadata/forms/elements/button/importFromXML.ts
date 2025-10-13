import { TButton, TButtonXML } from "./types"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import importI8nTextFromXML from "~/lib/metadata/i8nText/importI8nTextFromXML"
import importPictureFromXML from "../../pictures/importFromXML"
import importUseFromXML from "../../use/importFromXML"

export default function importButtonFromXML(xml: TButtonXML): TButton {
  const result: TButton = {
    name: xml.Button._name,
    id: xml.Button._id,
    title: importI8nTextFromXML(xml.Button.Title),
    toolTip: importI8nTextFromXML(xml.Button.ToolTip),
    use: importUseFromXML(xml.Button.Use),
    shortcut: xml.Button.Shortcut,
    picture: importPictureFromXML(xml.Button.Picture),
    action: xml.Button.Action,
    representation: xml.Button.Representation,
    currentRowUse: xml.Button.CurrentRowUse,
    modifiesSavedData: xml.Button.ModifiesSavedData,
    type: ElementType.Button,
  }
  return result
}
