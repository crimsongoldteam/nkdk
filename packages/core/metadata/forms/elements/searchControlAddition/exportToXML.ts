import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/metadata/context/types"
import { exportFormItemAdditionToXML } from "~/metadata/forms/elements/formItemAddition/exportToXML"
import { SearchControlAddition, SearchControlAdditionXML } from "~/metadata/forms/elements/searchControlAddition/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportSearchControlAdditionToXML = (
  context: Context,
  data: SearchControlAddition | undefined
): SearchControlAdditionXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormItemAdditionToXML(context, data)!,

    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(context, data.backColor),
    BorderColor: exportColorToXML(context, data.borderColor),
    Font: exportFontToXML(context, data.font),
    HorizontalStretch: data.horizontalStretch,
    MaxWidth: data.maxWidth,
    TextColor: exportColorToXML(context, data.textColor),
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    Width: data.width,
  })
}

registerMetadata("ExportToXML", "SearchControlAddition", exportSearchControlAdditionToXML)
