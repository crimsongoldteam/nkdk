import { importFormFieldFromXML } from "../formField/importFromXML"
import { TDendrogramFieldXML, TDendrogramField } from "./types"
import { ZElementType } from "../types"

export const importDendrogramFieldFromXML = (xml: TDendrogramFieldXML | undefined): TDendrogramField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.DendrogramField,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    height: xml.Height,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    verticalStretch: xml.VerticalStretch,
    horizontalStretch: xml.HorizontalStretch,
    width: xml.Width,
  }
}