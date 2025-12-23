import { exportChoiceListToXML } from "~/lib/metadata/commonObjects/choiceList/exportToXML"
import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { RadioButtonField, RadioButtonFieldXML } from "~/lib/metadata/forms/elements/radioButtonField/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportRadioButtonFieldToXML = (
  context: Context,
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
