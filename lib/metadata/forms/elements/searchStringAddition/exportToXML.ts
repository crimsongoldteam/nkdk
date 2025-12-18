import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormItemAdditionToXML } from "~/lib/metadata/forms/elements/formItemAddition/exportToXML"
import { SearchStringAddition, SearchStringAdditionXML } from "~/lib/metadata/forms/elements/searchStringAddition/types"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportSearchStringAdditionToXML = (
  data: SearchStringAddition | undefined,
  configurationSettings: ConfigurationSettings
): SearchStringAdditionXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormItemAdditionToXML(data, configurationSettings)!,

    BackColor: exportColorToXML(data.backColor, configurationSettings),
    BorderColor: exportColorToXML(data.borderColor, configurationSettings),
    Font: exportFontToXML(data.font, configurationSettings),
    HorizontalStretch: data.horizontalStretch,
    TextColor: exportColorToXML(data.textColor, configurationSettings),
    Width: data.width,
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
  }
}

registerMetadata("ExportToXML", "SearchStringAddition", exportSearchStringAdditionToXML)
