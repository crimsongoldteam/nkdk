import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TProgressBarFieldXML, TProgressBarField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportProgressBarFieldToXML = (data: TProgressBarField | undefined): TProgressBarFieldXML | undefined => {
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
    MaxValue: data.maxValue,
    MaxWidth: data.maxWidth,
    MinValue: data.minValue,
    Orientation: data.orientation,
    Representation: data.representation,
    ShowPercent: data.showPercent,
    VerticalStretch: data.verticalStretch,
    Width: data.width,
  }
}

registerExport(ZElementType.enum.ProgressBarField, exportProgressBarFieldToXML)