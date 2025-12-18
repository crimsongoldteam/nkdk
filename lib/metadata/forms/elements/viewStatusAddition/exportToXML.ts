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
  data: ViewStatusAddition | undefined,
  configurationSettings: ConfigurationSettings
): ViewStatusAdditionXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormItemAdditionToXML(data, configurationSettings)!,

    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(data.backColor, configurationSettings),
    Border: exportBorderToXML(data.border, configurationSettings),
    BorderColor: exportColorToXML(data.borderColor, configurationSettings),
    ButtonsBackColor: exportColorToXML(data.buttonsBackColor, configurationSettings),
    Font: exportFontToXML(data.font, configurationSettings),
    HorizontalAlign: data.horizontalAlign,
    HorizontalStretch: data.horizontalStretch,
    MaxWidth: data.maxWidth,
    TextColor: exportColorToXML(data.textColor, configurationSettings),
    TitleFont: exportFontToXML(data.titleFont, configurationSettings),
    TitleTextColor: exportColorToXML(data.titleTextColor, configurationSettings),
    Width: data.width,
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
  })
}

registerMetadata("ExportToXML", "ViewStatusAddition", exportViewStatusAdditionToXML)
