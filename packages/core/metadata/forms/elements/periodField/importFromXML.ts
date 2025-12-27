import { importBorderFromXML } from "~/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { PeriodField, PeriodFieldXML } from "~/metadata/forms/elements/periodField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importPeriodFieldFromXML = (
  context: Context,
  xml: PeriodFieldXML | undefined
): PeriodField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(context, xml)!,
    elementType: FormElementType.PeriodField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    border: importBorderFromXML(context, xml.Border),
    borderColor: importColorFromXML(context, xml.BorderColor),
    font: importFontFromXML(context, xml.Font),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "PeriodField", importPeriodFieldFromXML)
