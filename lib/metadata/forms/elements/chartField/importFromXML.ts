import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { ChartField, ChartFieldXML } from "~/lib/metadata/forms/elements/chartField/types"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importChartFieldFromXML = (context: Context, xml: ChartFieldXML | undefined): ChartField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(context, xml)!,
    elementType: FormElementType.ChartField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
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

registerMetadata("ImportFromXML", "ChartField", importChartFieldFromXML)
