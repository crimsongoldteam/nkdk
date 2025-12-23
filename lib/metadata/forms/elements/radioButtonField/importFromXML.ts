import { importChoiceListFromXML } from "~/lib/metadata/commonObjects/choiceList/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { RadioButtonField, RadioButtonFieldXML } from "~/lib/metadata/forms/elements/radioButtonField/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importRadioButtonFieldFromXML = (
  configurationSettings: ConfigurationSettings, xml: RadioButtonFieldXML | undefined
): RadioButtonField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(configurationSettings, xml)!,
    elementType: FormElementType.RadioButtonField,

    backColor: importColorFromXML(configurationSettings, xml.BackColor),
    borderColor: importColorFromXML(configurationSettings, xml.BorderColor),
    choiceList: importChoiceListFromXML(configurationSettings, xml.ChoiceList),
    columnsCount: xml.ColumnsCount,
    equalColumnsWidth: xml.EqualColumnsWidth,
    font: importFontFromXML(configurationSettings, xml.Font),
    itemHeight: xml.ItemHeight,
    itemTitleHeight: xml.ItemTitleHeight,
    itemWidth: xml.ItemWidth,
    radioButtonType: xml.RadioButtonType,
    textColor: importColorFromXML(configurationSettings, xml.TextColor),
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
    events: importEventsFromXML(configurationSettings, xml.Events),
  })
}

registerMetadata("ImportFromXML", "RadioButtonField", importRadioButtonFieldFromXML)
