import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TTrackBarFieldXML, TTrackBarField } from "./types"


export const importTrackBarFieldFromXML = (xml: TTrackBarFieldXML | undefined): TTrackBarField | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
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