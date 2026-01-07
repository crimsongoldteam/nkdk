import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { CheckBoxField, CheckBoxFieldXML } from "~/metadata/forms/elements/checkBoxField/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportCheckBoxFieldToXML = (
  context: ConfigurationContext,
  data: CheckBoxField | undefined
): CheckBoxFieldXML | undefined => {
  if (!data) return undefined

  const baseFields = exportFormFieldToXML(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,

    BackColor: exportColorToXML(context, data.backColor),
    BorderColor: exportColorToXML(context, data.borderColor),
    CheckBoxType: data.checkBoxType,
    EditFormat: exportI8nTextToXML(context, data.editFormat),
    EqualItemsWidth: data.equalItemsWidth,
    Font: exportFontToXML(context, data.font),
    ItemHeight: data.itemHeight,
    ItemTitleHeight: data.itemTitleHeight,
    ItemWidth: data.itemWidth,
    TextColor: exportColorToXML(context, data.textColor),
    ThreeState: data.threeState,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    Events: exportEventsToXML(context, data.events),
  }
}

registerMetadata("ExportToXML", "CheckBoxField", exportCheckBoxFieldToXML)
