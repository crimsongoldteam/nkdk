import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { CheckBoxField, CheckBoxFieldXML } from "~/lib/metadata/forms/elements/checkBoxField/types"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportCheckBoxFieldToXML = (
  context: Context,
  data: CheckBoxField | undefined
): CheckBoxFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(context, data)!,

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
  })
}

registerMetadata("ExportToXML", "CheckBoxField", exportCheckBoxFieldToXML)
