import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TGeographicalSchemaFieldXML, TGeographicalSchemaField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportGeographicalSchemaFieldToXML = (data: TGeographicalSchemaField | undefined): TGeographicalSchemaFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BorderColor: exportColorToXML(data.borderColor),
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Output: data.output,
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Events: data.events ? {
       DetailProcessing: data.events.detailProcessing,
       BeforeWrite: data.events.beforeWrite,
       BeforePrint: data.events.beforePrint,
       AfterWrite: data.events.afterWrite,
    } : undefined,
  }
}

registerExport(ZElementType.enum.GeographicalSchemaField, exportGeographicalSchemaFieldToXML)