import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TProgressBarFieldXML, TProgressBarField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importProgressBarFieldFromXML = (xml: TProgressBarFieldXML | undefined): TProgressBarField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.ProgressBarField,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    borderColor: importColorFromXML(xml.BorderColor),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxValue: xml.MaxValue,
    maxWidth: xml.MaxWidth,
    minValue: xml.MinValue,
    orientation: xml.Orientation,
    representation: xml.Representation,
    showPercent: xml.ShowPercent,
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
  }
}

registerImport(ZElementType.enum.ProgressBarField, importProgressBarFieldFromXML)