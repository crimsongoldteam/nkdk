import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { CheckBoxField, CheckBoxFieldXML } from "~/lib/metadata/forms/elements/checkBoxField/types"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportCheckBoxFieldToXML = (
  data: CheckBoxField | undefined,
  configurationSettings: ConfigurationSettings
): CheckBoxFieldXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToXML(data, configurationSettings)!,

    BackColor: exportColorToXML(data.backColor, configurationSettings),
    BorderColor: exportColorToXML(data.borderColor, configurationSettings),
    CheckBoxType: data.checkBoxType,
    EditFormat: exportI8nTextToXML(data.editFormat, configurationSettings),
    EqualItemsWidth: data.equalItemsWidth,
    Font: exportFontToXML(data.font, configurationSettings),
    ItemHeight: data.itemHeight,
    ItemTitleHeight: data.itemTitleHeight,
    ItemWidth: data.itemWidth,
    TextColor: exportColorToXML(data.textColor, configurationSettings),
    ThreeState: data.threeState,
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
    Events: exportEventsToXML(data.events, configurationSettings),
  }
}

registerMetadata("ExportToXML", "CheckBoxField", exportCheckBoxFieldToXML)
