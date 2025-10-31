import { exportFormFieldToXML } from "../formField/exportToXML"
import { TTrackBarFieldXML, TTrackBarField } from "./types"

export const exportTrackBarFieldToXML = (data: TTrackBarField | undefined): TTrackBarFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    LargeStep: data.largeStep,
    Height: data.height,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    MaxValue: data.maxValue,
    MinValue: data.minValue,
    Orientation: data.orientation,
    MarkingAppearance: data.markingAppearance,
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    Step: data.step,
    MarkingStep: data.markingStep,
    Width: data.width,
  }
}