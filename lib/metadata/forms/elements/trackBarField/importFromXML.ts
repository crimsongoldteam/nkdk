import { importFormFieldFromXML } from "../formField/importFromXML"
import { TTrackBarFieldXML, TTrackBarField } from "./types"
import { ZElementType } from "../types"

export const importTrackBarFieldFromXML = (xml: TTrackBarFieldXML | undefined): TTrackBarField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.TrackBarField,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    largeStep: xml.LargeStep,
    height: xml.Height,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    maxValue: xml.MaxValue,
    minValue: xml.MinValue,
    orientation: xml.Orientation,
    markingAppearance: xml.MarkingAppearance,
    verticalStretch: xml.VerticalStretch,
    horizontalStretch: xml.HorizontalStretch,
    step: xml.Step,
    markingStep: xml.MarkingStep,
    width: xml.Width,
  }
}