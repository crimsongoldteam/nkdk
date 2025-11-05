import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TGeographicalSchemaFieldXML, TGeographicalSchemaField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importGeographicalSchemaFieldFromXML = (xml: TGeographicalSchemaFieldXML | undefined): TGeographicalSchemaField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.GeographicalSchemaField,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    borderColor: importColorFromXML(xml.BorderColor),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    output: xml.Output,
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: xml.Events ? {
       detailProcessing: xml.Events.DetailProcessing,
       beforeWrite: xml.Events.BeforeWrite,
       beforePrint: xml.Events.BeforePrint,
       afterWrite: xml.Events.AfterWrite,
    } : undefined,
  }
}

registerImport(ZElementType.enum.GeographicalSchemaField, importGeographicalSchemaFieldFromXML)