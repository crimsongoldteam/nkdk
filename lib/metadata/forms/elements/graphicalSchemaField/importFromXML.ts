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
    output: xml.Output,
    height: xml.Height,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    verticalStretch: xml.VerticalStretch,
    horizontalStretch: xml.HorizontalStretch,
    edit: xml.Edit,
    borderColor: importColorFromXML(xml.BorderColor),
    width: xml.Width,
  }
}

registerImport(ZElementType.enum.GraphicalSchemaField, importGraphicalSchemaFieldFromXML)