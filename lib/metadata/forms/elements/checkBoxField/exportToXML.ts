import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportCheckBoxFieldToXML = (data: CheckBoxField | undefined): CheckBoxFieldXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToXML(data)!,

    BackColor: exportColorToXML(data.backColor),
    BorderColor: exportColorToXML(data.borderColor),
    CheckBoxType: data.checkBoxType,
    EditFormat: exportI8nTextToXML(data.editFormat),
    EqualItemsWidth: data.equalItemsWidth,
    Font: exportFontToXML(data.font),
    ItemHeight: data.itemHeight,
    ItemTitleHeight: data.itemTitleHeight,
    ItemWidth: data.itemWidth,
    TextColor: exportColorToXML(data.textColor),
    ThreeState: data.threeState,
    UserVisible: exportUserVisibleToXML(data.userVisible),
    Events: exportEventsToXML(data.events),
  }
}

registerExport(FormElementType.CheckBoxField, exportCheckBoxFieldToXML)
