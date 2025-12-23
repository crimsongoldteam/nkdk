import { importChoiceListFromXML } from "~/lib/metadata/commonObjects/choiceList/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { RadioButtonField, RadioButtonFieldXML } from "~/lib/metadata/forms/elements/radioButtonField/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importRadioButtonFieldFromXML = (
  context: Context,
  xml: RadioButtonFieldXML | undefined
): RadioButtonField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(context, xml)!,
    elementType: FormElementType.RadioButtonField,

    backColor: importColorFromXML(context, xml.BackColor),
    borderColor: importColorFromXML(context, xml.BorderColor),
    choiceList: importChoiceListFromXML(context, xml.ChoiceList),
    columnsCount: xml.ColumnsCount,
    equalColumnsWidth: xml.EqualColumnsWidth,
    font: importFontFromXML(context, xml.Font),
    itemHeight: xml.ItemHeight,
    itemTitleHeight: xml.ItemTitleHeight,
    itemWidth: xml.ItemWidth,
    radioButtonType: xml.RadioButtonType,
    textColor: importColorFromXML(context, xml.TextColor),
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "RadioButtonField", importRadioButtonFieldFromXML)
