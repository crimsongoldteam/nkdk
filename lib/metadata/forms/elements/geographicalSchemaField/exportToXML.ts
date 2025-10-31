import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TGeographicalSchemaFieldXML, TGeographicalSchemaField } from "./types"

export const exportGeographicalSchemaFieldToXML = (data: TGeographicalSchemaField | undefined): TGeographicalSchemaFieldXML | undefined => {
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
    BorderColor: exportColorToXML(data.borderColor),
    Width: data.width,
  }
}