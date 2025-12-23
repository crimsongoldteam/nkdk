import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { exportFormItemAdditionToXML } from "~/lib/metadata/forms/elements/formItemAddition/exportToXML"
import {
  SearchControlAddition,
  SearchControlAdditionXML,
} from "~/lib/metadata/forms/elements/searchControlAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

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
