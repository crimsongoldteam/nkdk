import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { CheckBoxField, CheckBoxFieldXML } from "~/lib/metadata/forms/elements/checkBoxField/types"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importCheckBoxFieldFromXML = (
  context: Context,
  xml: CheckBoxFieldXML | undefined
): CheckBoxField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(context, xml)!,
    elementType: FormElementType.CheckBoxField,

    backColor: importColorFromXML(context, xml.BackColor),
    borderColor: importColorFromXML(context, xml.BorderColor),
    checkBoxType: xml.CheckBoxType,
    editFormat: importI8nTextFromXML(context, xml.EditFormat),
    equalItemsWidth: xml.EqualItemsWidth,
    font: importFontFromXML(context, xml.Font),
    itemHeight: xml.ItemHeight,
    itemTitleHeight: xml.ItemTitleHeight,
    itemWidth: xml.ItemWidth,
    textColor: importColorFromXML(context, xml.TextColor),
    threeState: xml.ThreeState,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "CheckBoxField", importCheckBoxFieldFromXML)
