import { importUserVisibleFromXML } from "~/packages/core/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/packages/core/metadata/context/types"
import { importFormFieldFromXML } from "~/packages/core/metadata/forms/elements/formField/importFromXML"
import { PlannerField, PlannerFieldXML } from "~/packages/core/metadata/forms/elements/plannerField/types"
import { importEventsFromXML } from "~/packages/core/metadata/forms/events/importFromXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"

export const importPlannerFieldFromXML = (
  context: Context,
  xml: PlannerFieldXML | undefined
): PlannerField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(context, xml)!,
    elementType: FormElementType.PlannerField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    dimensionItemHyperlink: xml.DimensionItemHyperlink,
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    timeScaleItemHyperlink: xml.TimeScaleItemHyperlink,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    wrappedTimeScaleHeaderHyperlink: xml.WrappedTimeScaleHeaderHyperlink,
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "PlannerField", importPlannerFieldFromXML)
