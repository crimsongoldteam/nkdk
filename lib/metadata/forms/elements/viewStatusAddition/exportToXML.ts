import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormItemAdditionToXML } from "~/lib/metadata/forms/elements/formItemAddition/exportToXML"
import { ViewStatusAddition, ViewStatusAdditionXML } from "~/lib/metadata/forms/elements/viewStatusAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportViewStatusAdditionToXML = (
  configurationSettings: ConfigurationSettings,
  data: ViewStatusAddition | undefined
): ViewStatusAdditionXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormItemAdditionToXML(configurationSettings, data)!,

    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(configurationSettings, data.backColor),
    Border: exportBorderToXML(configurationSettings, data.border),
    BorderColor: exportColorToXML(configurationSettings, data.borderColor),
    ButtonsBackColor: exportColorToXML(configurationSettings, data.buttonsBackColor),
    Font: exportFontToXML(configurationSettings, data.font),
    HorizontalAlign: data.horizontalAlign,
    HorizontalStretch: data.horizontalStretch,
    MaxWidth: data.maxWidth,
    TextColor: exportColorToXML(configurationSettings, data.textColor),
    TitleFont: exportFontToXML(configurationSettings, data.titleFont),
    TitleTextColor: exportColorToXML(configurationSettings, data.titleTextColor),
    UserVisible: exportUserVisibleToXML(configurationSettings, data.userVisible),
    Width: data.width,
  })
}

registerMetadata("ExportToXML", "ViewStatusAddition", exportViewStatusAdditionToXML)
