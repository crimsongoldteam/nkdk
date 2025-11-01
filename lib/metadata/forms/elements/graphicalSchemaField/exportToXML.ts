import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TGraphicalSchemaFieldXML, TGraphicalSchemaField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectByKeys } from "~/lib/xml/export/sortObjectKeys"

const ORDER: string[] = []

export const exportGraphicalSchemaFieldToXML = (data: TGraphicalSchemaField | undefined): TGraphicalSchemaFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return sortObjectByKeys<TGraphicalSchemaFieldXML>( {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BorderColor: exportColorToXML(data.borderColor),
    Edit: data.edit,
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Output: data.output,
    VerticalStretch: data.verticalStretch,
    Width: data.width,
  }, ORDER)
}

registerExport(ZElementType.enum.GraphicalSchemaField, exportGraphicalSchemaFieldToXML)