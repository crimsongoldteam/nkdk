import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormItemAdditionToXML } from "~/lib/metadata/forms/elements/formItemAddition/exportToXML"
import { SearchStringAddition, SearchStringAdditionXML } from "~/lib/metadata/forms/elements/searchStringAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportSearchStringAdditionToXML = (
  configurationSettings: ConfigurationSettings,
  data: SearchStringAddition | undefined
): SearchStringAdditionXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormItemAdditionToXML(configurationSettings, data)!,

    BackColor: exportColorToXML(configurationSettings, data.backColor),
    BorderColor: exportColorToXML(configurationSettings, data.borderColor),
    Font: exportFontToXML(configurationSettings, data.font),
    HorizontalStretch: data.horizontalStretch,
    TextColor: exportColorToXML(configurationSettings, data.textColor),
    UserVisible: exportUserVisibleToXML(configurationSettings, data.userVisible),
    Width: data.width,
  })
}

registerMetadata("ExportToXML", "SearchStringAddition", exportSearchStringAdditionToXML)
