import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { PlannerField, PlannerFieldXML } from "~/metadata/forms/elements/plannerField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importPlannerFieldFromXML = (
  context: ConfigurationContext,
  xml: PlannerFieldXML | undefined
): PlannerField | undefined => {
  if (!xml) return undefined

  const baseFields = importFormFieldFromXML(context, xml)
  if (!baseFields) return undefined

  const { elementType: _, ...restFields } = baseFields

  const result: PlannerField = {
    elementType: FormElementType.PlannerField,
    ...restFields,
  }

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  if (xml.DimensionItemHyperlink !== undefined) result.dimensionItemHyperlink = xml.DimensionItemHyperlink

  if (xml.EnableDrag !== undefined) result.enableDrag = xml.EnableDrag

  if (xml.EnableStartDrag !== undefined) result.enableStartDrag = xml.EnableStartDrag

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  if (xml.TimeScaleItemHyperlink !== undefined) result.timeScaleItemHyperlink = xml.TimeScaleItemHyperlink

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Width !== undefined) result.width = xml.Width

  if (xml.WrappedTimeScaleHeaderHyperlink !== undefined)
    result.wrappedTimeScaleHeaderHyperlink = xml.WrappedTimeScaleHeaderHyperlink

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromXML", "PlannerField", importPlannerFieldFromXML)
