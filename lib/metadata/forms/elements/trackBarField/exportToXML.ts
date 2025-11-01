import { exportFormFieldToXML } from "../formField/exportToXML"
import { TTrackBarFieldXML, TTrackBarField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportTrackBarFieldToXML = (data: TTrackBarField | undefined): TTrackBarFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    LargeStep: data.largeStep,
    MarkingAppearance: data.markingAppearance,
    MarkingStep: data.markingStep,
    MaxHeight: data.maxHeight,
    MaxValue: data.maxValue,
    MaxWidth: data.maxWidth,
    MinValue: data.minValue,
    Orientation: data.orientation,
    Step: data.step,
    VerticalStretch: data.verticalStretch,
    Width: data.width,
  }
}

registerExport(ZElementType.enum.TrackBarField, exportTrackBarFieldToXML)