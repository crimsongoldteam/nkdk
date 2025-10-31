import { importColorFromXML } from "~/lib/metadata/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/font/importFromXML"
import { importBorderFromXML } from "~/lib/metadata/forms/border/importFromXML"
import { importFormItemAdditionFromXML } from "../formItemAddition/importFromXML"
import { TViewStatusAdditionXML, TViewStatusAddition } from "./types"

export const importViewStatusAdditionFromXML = (xml: TViewStatusAdditionXML | undefined): TViewStatusAddition | undefined => {
  if (!xml) return undefined 

  const base = importFormItemAdditionFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    autoMaxWidth: xml.AutoMaxWidth,
    horizontalAlign: xml.HorizontalAlign,
    maxWidth: xml.MaxWidth,
    border: importBorderFromXML(xml.Border),
    horizontalStretch: xml.HorizontalStretch,
    borderColor: importColorFromXML(xml.BorderColor),
    textColor: importColorFromXML(xml.TextColor),
    titleTextColor: importColorFromXML(xml.TitleTextColor),
    backColor: importColorFromXML(xml.BackColor),
    buttonsBackColor: importColorFromXML(xml.ButtonsBackColor),
    width: xml.Width,
    font: importFontFromXML(xml.Font),
    titleFont: importFontFromXML(xml.TitleFont),
  }
}