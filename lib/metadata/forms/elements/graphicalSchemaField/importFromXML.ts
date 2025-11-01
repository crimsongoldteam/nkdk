import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TGraphicalSchemaFieldXML, TGraphicalSchemaField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importGraphicalSchemaFieldFromXML = (xml: TGraphicalSchemaFieldXML | undefined): TGraphicalSchemaField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.GraphicalSchemaField,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    borderColor: importColorFromXML(xml.BorderColor),
    edit: xml.Edit,
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    output: xml.Output,
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
  }
}

registerImport(ZElementType.enum.GraphicalSchemaField, importGraphicalSchemaFieldFromXML)