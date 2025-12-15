import { exportChoiceListToXML } from "~/lib/metadata/commonObjects/choiceList/exportToXML"
import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportRadioButtonFieldToXML = (data: RadioButtonField | undefined): RadioButtonFieldXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToXML(data)!,

    BackColor: exportColorToXML(data.backColor),
    BorderColor: exportColorToXML(data.borderColor),
    ChoiceList: exportChoiceListToXML(data.choiceList),
    ColumnsCount: data.columnsCount,
    EqualColumnsWidth: data.equalColumnsWidth,
    Font: exportFontToXML(data.font),
    ItemHeight: data.itemHeight,
    ItemTitleHeight: data.itemTitleHeight,
    ItemWidth: data.itemWidth,
    RadioButtonType: data.radioButtonType,
    TextColor: exportColorToXML(data.textColor),
    UserVisible: exportUserVisibleToXML(data.userVisible),
    Events: exportEventsToXML(data.events),
  }
}

registerExport(FormElementType.RadioButtonField, exportRadioButtonFieldToXML)
