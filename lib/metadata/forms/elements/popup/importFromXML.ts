import importColorFromXML from "~/lib/metadata/color/importFromXML"
import importPictureFromXML from "../../pictures/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TPopupXML, TPopup } from "./types"


export const importPopupFromXML = (xml: TPopupXML | undefined): TPopup | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     picture: importPictureFromXML(xml.Picture),
     representation: xml.Representation,
     shapeRepresentation: xml.ShapeRepresentation,
     shape: xml.Shape,
     borderColor: importColorFromXML(xml.BorderColor),
     backColor: importColorFromXML(xml.BackColor),
  }
}