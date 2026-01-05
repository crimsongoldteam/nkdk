import { importChoiceListFromXML } from "~/metadata/commonObjects/choiceList/importFromXML"
import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { RadioButtonField, RadioButtonFieldXML } from "~/metadata/forms/elements/radioButtonField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importRadioButtonFieldFromXML = (
  context: ConfigurationContext,
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
