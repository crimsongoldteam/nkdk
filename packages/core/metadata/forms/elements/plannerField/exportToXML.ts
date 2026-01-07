import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import { PlannerField, PlannerFieldXML } from "~/metadata/forms/elements/plannerField/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportPlannerFieldToXML = (
  context: ConfigurationContext,
  data: PlannerField | undefined
): PlannerFieldXML | undefined => {
  if (!data) return undefined

  const baseFields = exportFormFieldToXML(context, data)
  if (!baseFields) return undefined

  const result: PlannerFieldXML = {
    ...baseFields,
  }

  if (data.autoMaxHeight !== undefined) result.AutoMaxHeight = data.autoMaxHeight

  if (data.autoMaxWidth !== undefined) result.AutoMaxWidth = data.autoMaxWidth

  if (data.dimensionItemHyperlink !== undefined) result.DimensionItemHyperlink = data.dimensionItemHyperlink

  if (data.enableDrag !== undefined) result.EnableDrag = data.enableDrag

  if (data.enableStartDrag !== undefined) result.EnableStartDrag = data.enableStartDrag

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.maxHeight !== undefined) result.MaxHeight = data.maxHeight

  if (data.maxWidth !== undefined) result.MaxWidth = data.maxWidth

  if (data.timeScaleItemHyperlink !== undefined) result.TimeScaleItemHyperlink = data.timeScaleItemHyperlink

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.width !== undefined) result.Width = data.width

  if (data.wrappedTimeScaleHeaderHyperlink !== undefined)
    result.WrappedTimeScaleHeaderHyperlink = data.wrappedTimeScaleHeaderHyperlink

  const events = exportEventsToXML(context, data.events)
  if (events !== undefined) result.Events = events

  return result
}

registerMetadata("ExportToXML", "PlannerField", exportPlannerFieldToXML)
