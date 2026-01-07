import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { ChartField, ChartFieldXML } from "~/metadata/forms/elements/chartField/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportChartFieldToXML = (
  context: ConfigurationContext,
  data: ChartField | undefined
): ChartFieldXML | undefined => {
  if (!data) return undefined

  const baseFields = exportFormFieldToXML(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Events: exportEventsToXML(context, data.events),
  }
}

registerMetadata("ExportToXML", "ChartField", exportChartFieldToXML)
