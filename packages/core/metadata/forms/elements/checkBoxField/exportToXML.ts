import { exportColorToXML } from "~/packages/core/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/packages/core/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/packages/core/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/packages/core/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { CheckBoxField, CheckBoxFieldXML } from "~/packages/core/metadata/forms/elements/checkBoxField/types"
import { exportFormFieldToXML } from "~/packages/core/metadata/forms/elements/formField/exportToXML"
import { exportEventsToXML } from "~/packages/core/metadata/forms/events/exportToXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"

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
