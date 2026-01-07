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

  return {
    const baseFields = exportFormFieldToXML(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    DimensionItemHyperlink: data.dimensionItemHyperlink,
    EnableDrag: data.enableDrag,
    EnableStartDrag: data.enableStartDrag,
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    TimeScaleItemHyperlink: data.timeScaleItemHyperlink,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    WrappedTimeScaleHeaderHyperlink: data.wrappedTimeScaleHeaderHyperlink,
    Events: exportEventsToXML(context, data.events),  }
}

registerMetadata("ExportToXML", "PlannerField", exportPlannerFieldToXML)
