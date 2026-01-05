import { exportChoiceListToXML } from "~/metadata/commonObjects/choiceList/exportToXML"
import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import { RadioButtonField, RadioButtonFieldXML } from "~/metadata/forms/elements/radioButtonField/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportRadioButtonFieldToXML = (
  context: ConfigurationContext,
  data: RadioButtonField | undefined
): RadioButtonFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(context, data)!,

    BackColor: exportColorToXML(context, data.backColor),
    BorderColor: exportColorToXML(context, data.borderColor),
    ChoiceList: exportChoiceListToXML(context, data.choiceList),
    ColumnsCount: data.columnsCount,
    EqualColumnsWidth: data.equalColumnsWidth,
    Font: exportFontToXML(context, data.font),
    ItemHeight: data.itemHeight,
    ItemTitleHeight: data.itemTitleHeight,
    ItemWidth: data.itemWidth,
    RadioButtonType: data.radioButtonType,
    TextColor: exportColorToXML(context, data.textColor),
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    Events: exportEventsToXML(context, data.events),
  })
}

registerMetadata("ExportToXML", "RadioButtonField", exportRadioButtonFieldToXML)
