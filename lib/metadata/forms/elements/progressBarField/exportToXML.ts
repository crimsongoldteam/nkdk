import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TProgressBarFieldXML, TProgressBarField } from "./types"

export const exportProgressBarFieldToXML = (data: TProgressBarField | undefined): TProgressBarFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Height: data.height,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    MaxValue: data.maxValue,
    MinValue: data.minValue,
    Orientation: data.orientation,
    ShowPercent: data.showPercent,
    Representation: data.representation,
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    BorderColor: exportColorToXML(data.borderColor),
    Width: data.width,
  }
}