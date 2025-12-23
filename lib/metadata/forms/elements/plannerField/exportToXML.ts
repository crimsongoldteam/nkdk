import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { PlannerField, PlannerFieldXML } from "~/lib/metadata/forms/elements/plannerField/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportPlannerFieldToXML = (
  configurationSettings: ConfigurationSettings, data: PlannerField | undefined
): PlannerFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(configurationSettings, data)!,

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
    UserVisible: exportUserVisibleToXML(configurationSettings, data.userVisible),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    WrappedTimeScaleHeaderHyperlink: data.wrappedTimeScaleHeaderHyperlink,
    Events: exportEventsToXML(configurationSettings, data.events),
  })
}

registerMetadata("ExportToXML", "PlannerField", exportPlannerFieldToXML)
