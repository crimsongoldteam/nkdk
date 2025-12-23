import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { CheckBoxField, CheckBoxFieldXML } from "~/lib/metadata/forms/elements/checkBoxField/types"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importCheckBoxFieldFromXML = (
  configurationSettings: ConfigurationSettings,
  xml: CheckBoxFieldXML | undefined
): CheckBoxField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(configurationSettings, xml)!,
    elementType: FormElementType.CheckBoxField,

    backColor: importColorFromXML(configurationSettings, xml.BackColor),
    borderColor: importColorFromXML(configurationSettings, xml.BorderColor),
    checkBoxType: xml.CheckBoxType,
    editFormat: importI8nTextFromXML(configurationSettings, xml.EditFormat),
    equalItemsWidth: xml.EqualItemsWidth,
    font: importFontFromXML(configurationSettings, xml.Font),
    itemHeight: xml.ItemHeight,
    itemTitleHeight: xml.ItemTitleHeight,
    itemWidth: xml.ItemWidth,
    textColor: importColorFromXML(configurationSettings, xml.TextColor),
    threeState: xml.ThreeState,
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
    events: importEventsFromXML(configurationSettings, xml.Events),
  })
}

registerMetadata("ImportFromXML", "CheckBoxField", importCheckBoxFieldFromXML)
