import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import { TextDocumentField, TextDocumentFieldXML } from "~/metadata/forms/elements/textDocumentField/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportTextDocumentFieldToXML = (
  context: ConfigurationContext,
  data: TextDocumentField | undefined
): TextDocumentFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(context, data)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(context, data.backColor),
    BorderColor: exportColorToXML(context, data.borderColor),
    Font: exportFontToXML(context, data.font),
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Output: data.output,
    SelectedText: data.selectedText,
    TextColor: exportColorToXML(context, data.textColor),
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Events: exportEventsToXML(context, data.events),
  })
}

registerMetadata("ExportToXML", "TextDocumentField", exportTextDocumentFieldToXML)
