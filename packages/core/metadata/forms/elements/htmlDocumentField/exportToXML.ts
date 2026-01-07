import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import { HTMLDocumentField, HTMLDocumentFieldXML } from "~/metadata/forms/elements/htmlDocumentField/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportHTMLDocumentFieldToXML = (
  context: ConfigurationContext,
  data: HTMLDocumentField | undefined
): HTMLDocumentFieldXML | undefined => {
  if (!data) return undefined

  const baseFields = exportFormFieldToXML(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BorderColor: exportColorToXML(context, data.borderColor),
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Output: data.output,
    UserAgentInformation: data.userAgentInformation,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Events: exportEventsToXML(context, data.events),
  }
}

registerMetadata("ExportToXML", "HTMLDocumentField", exportHTMLDocumentFieldToXML)
