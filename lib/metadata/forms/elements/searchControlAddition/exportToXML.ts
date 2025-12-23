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
  configurationSettings: Context,
  data: SearchControlAddition | undefined
): SearchControlAdditionXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormItemAdditionToXML(configurationSettings, data)!,

    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(configurationSettings, data.backColor),
    BorderColor: exportColorToXML(configurationSettings, data.borderColor),
    Font: exportFontToXML(configurationSettings, data.font),
    HorizontalStretch: data.horizontalStretch,
    MaxWidth: data.maxWidth,
    TextColor: exportColorToXML(configurationSettings, data.textColor),
    UserVisible: exportUserVisibleToXML(configurationSettings, data.userVisible),
    Width: data.width,
  })
}

registerMetadata("ExportToXML", "SearchControlAddition", exportSearchControlAdditionToXML)
