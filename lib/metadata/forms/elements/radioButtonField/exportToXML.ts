import { exportChoiceListToXML } from "~/lib/metadata/commonObjects/choiceList/exportToXML"
import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { RadioButtonField, RadioButtonFieldXML } from "~/lib/metadata/forms/elements/radioButtonField/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportRadioButtonFieldToXML = (
  data: RadioButtonField | undefined,
  configurationSettings: ConfigurationSettings
): RadioButtonFieldXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToXML(data, configurationSettings)!,

    BackColor: exportColorToXML(data.backColor, configurationSettings),
    BorderColor: exportColorToXML(data.borderColor, configurationSettings),
    ChoiceList: exportChoiceListToXML(data.choiceList, configurationSettings),
    ColumnsCount: data.columnsCount,
    EqualColumnsWidth: data.equalColumnsWidth,
    Font: exportFontToXML(data.font, configurationSettings),
    ItemHeight: data.itemHeight,
    ItemTitleHeight: data.itemTitleHeight,
    ItemWidth: data.itemWidth,
    RadioButtonType: data.radioButtonType,
    TextColor: exportColorToXML(data.textColor, configurationSettings),
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
    Events: exportEventsToXML(data.events, configurationSettings),
  }
}

registerMetadata("ExportToXML", "RadioButtonField", exportRadioButtonFieldToXML)
