import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TGraphicalSchemaFieldXML, TGraphicalSchemaField } from "./types"

export const exportGraphicalSchemaFieldToXML = (data: TGraphicalSchemaField | undefined): TGraphicalSchemaFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Output: data.output,
    Height: data.height,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    Edit: data.edit,
    BorderColor: exportColorToXML(data.borderColor),
    Width: data.width,
  }
}