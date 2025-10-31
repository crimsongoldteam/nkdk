import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TProgressBarFieldXML, TProgressBarField } from "./types"

export const importProgressBarFieldFromXML = (xml: TProgressBarFieldXML | undefined): TProgressBarField | undefined => {
  if (!xml) return undefined 

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    height: xml.Height,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    maxValue: xml.MaxValue,
    minValue: xml.MinValue,
    orientation: xml.Orientation,
    showPercent: xml.ShowPercent,
    representation: xml.Representation,
    verticalStretch: xml.VerticalStretch,
    horizontalStretch: xml.HorizontalStretch,
    borderColor: importColorFromXML(xml.BorderColor),
    width: xml.Width,
  }
}