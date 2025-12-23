import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { CheckBoxField, CheckBoxFieldXML } from "~/lib/metadata/forms/elements/checkBoxField/types"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportCheckBoxFieldToXML = (
  configurationSettings: ConfigurationSettings,
  data: CheckBoxField | undefined
): CheckBoxFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(configurationSettings, data)!,

    BackColor: exportColorToXML(configurationSettings, data.backColor),
    BorderColor: exportColorToXML(configurationSettings, data.borderColor),
    CheckBoxType: data.checkBoxType,
    EditFormat: exportI8nTextToXML(configurationSettings, data.editFormat),
    EqualItemsWidth: data.equalItemsWidth,
    Font: exportFontToXML(configurationSettings, data.font),
    ItemHeight: data.itemHeight,
    ItemTitleHeight: data.itemTitleHeight,
    ItemWidth: data.itemWidth,
    TextColor: exportColorToXML(configurationSettings, data.textColor),
    ThreeState: data.threeState,
    UserVisible: exportUserVisibleToXML(configurationSettings, data.userVisible),
    Events: exportEventsToXML(configurationSettings, data.events),
  })
}

registerMetadata("ExportToXML", "CheckBoxField", exportCheckBoxFieldToXML)
