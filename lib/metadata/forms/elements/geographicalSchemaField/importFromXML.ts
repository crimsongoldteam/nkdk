import { importColorFromXML } from "~/lib/metadata/color/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TGeographicalSchemaFieldXML, TGeographicalSchemaField } from "./types"

export const importGeographicalSchemaFieldFromXML = (xml: TGeographicalSchemaFieldXML | undefined): TGeographicalSchemaField | undefined => {
  if (!xml) return undefined 

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    output: xml.Output,
    height: xml.Height,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    verticalStretch: xml.VerticalStretch,
    horizontalStretch: xml.HorizontalStretch,
    borderColor: importColorFromXML(xml.BorderColor),
    width: xml.Width,
  }
}