import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"

export const importCheckBoxFieldFromXML = (xml: CheckBoxFieldXML | undefined): CheckBoxField | undefined => {
  if (!xml) return undefined

  return {
    ...importFormFieldFromXML(xml)!,
    elementType: FormElementType.CheckBoxField,

    backColor: importColorFromXML(xml.BackColor),
    borderColor: importColorFromXML(xml.BorderColor),
    checkBoxType: xml.CheckBoxType,
    editFormat: importI8nTextFromXML(xml.EditFormat),
    equalItemsWidth: xml.EqualItemsWidth,
    font: importFontFromXML(xml.Font),
    itemHeight: xml.ItemHeight,
    itemTitleHeight: xml.ItemTitleHeight,
    itemWidth: xml.ItemWidth,
    textColor: importColorFromXML(xml.TextColor),
    threeState: xml.ThreeState,
    userVisible: importUserVisibleFromXML(xml.UserVisible),
    events: importEventsFromXML(xml.Events),
  }
}

registerImport(FormElementType.CheckBoxField, importCheckBoxFieldFromXML)
