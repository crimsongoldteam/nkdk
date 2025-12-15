import { importChoiceListFromXML } from "~/lib/metadata/commonObjects/choiceList/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"

export const importRadioButtonFieldFromXML = (xml: RadioButtonFieldXML | undefined): RadioButtonField | undefined => {
  if (!xml) return undefined

  return {
    ...importFormFieldFromXML(xml)!,
    elementType: FormElementType.RadioButtonField,

    backColor: importColorFromXML(xml.BackColor),
    borderColor: importColorFromXML(xml.BorderColor),
    choiceList: importChoiceListFromXML(xml.ChoiceList),
    columnsCount: xml.ColumnsCount,
    equalColumnsWidth: xml.EqualColumnsWidth,
    font: importFontFromXML(xml.Font),
    itemHeight: xml.ItemHeight,
    itemTitleHeight: xml.ItemTitleHeight,
    itemWidth: xml.ItemWidth,
    radioButtonType: xml.RadioButtonType,
    textColor: importColorFromXML(xml.TextColor),
    userVisible: importUserVisibleFromXML(xml.UserVisible),
    events: importEventsFromXML(xml.Events),
  }
}

registerImport(FormElementType.RadioButtonField, importRadioButtonFieldFromXML)
