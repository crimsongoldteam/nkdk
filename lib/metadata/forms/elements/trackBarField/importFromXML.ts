import { importFormFieldFromXML } from "../formField/importFromXML"
import { TTrackBarFieldXML, TTrackBarField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importTrackBarFieldFromXML = (xml: TTrackBarFieldXML | undefined): TTrackBarField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.TrackBarField,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    largeStep: xml.LargeStep,
    markingAppearance: xml.MarkingAppearance,
    markingStep: xml.MarkingStep,
    maxHeight: xml.MaxHeight,
    maxValue: xml.MaxValue,
    maxWidth: xml.MaxWidth,
    minValue: xml.MinValue,
    orientation: xml.Orientation,
    step: xml.Step,
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
  }
}

registerImport(ZElementType.enum.TrackBarField, importTrackBarFieldFromXML)