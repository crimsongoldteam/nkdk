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
  xml: CheckBoxFieldXML | undefined,
  configurationSettings: ConfigurationSettings
): CheckBoxField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(xml, configurationSettings)!,
    elementType: FormElementType.CheckBoxField,

    backColor: importColorFromXML(xml.BackColor, configurationSettings),
    borderColor: importColorFromXML(xml.BorderColor, configurationSettings),
    checkBoxType: xml.CheckBoxType,
    editFormat: importI8nTextFromXML(xml.EditFormat, configurationSettings),
    equalItemsWidth: xml.EqualItemsWidth,
    font: importFontFromXML(xml.Font, configurationSettings),
    itemHeight: xml.ItemHeight,
    itemTitleHeight: xml.ItemTitleHeight,
    itemWidth: xml.ItemWidth,
    textColor: importColorFromXML(xml.TextColor, configurationSettings),
    threeState: xml.ThreeState,
    userVisible: importUserVisibleFromXML(xml.UserVisible, configurationSettings),
    events: importEventsFromXML(xml.Events, configurationSettings),
  })
}

registerMetadata("ImportFromXML", "CheckBoxField", importCheckBoxFieldFromXML)
