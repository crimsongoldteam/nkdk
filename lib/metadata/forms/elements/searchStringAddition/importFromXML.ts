import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormItemAdditionFromXML } from "~/lib/metadata/forms/elements/formItemAddition/importFromXML"
import { SearchStringAddition, SearchStringAdditionXML } from "~/lib/metadata/forms/elements/searchStringAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importSearchStringAdditionFromXML = (
  xml: SearchStringAdditionXML | undefined,
  configurationSettings: ConfigurationSettings
): SearchStringAddition | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormItemAdditionFromXML(xml, configurationSettings)!,
    elementType: FormElementType.SearchStringAddition,

    backColor: importColorFromXML(xml.BackColor, configurationSettings),
    borderColor: importColorFromXML(xml.BorderColor, configurationSettings),
    font: importFontFromXML(xml.Font, configurationSettings),
    horizontalStretch: xml.HorizontalStretch,
    textColor: importColorFromXML(xml.TextColor, configurationSettings),
    userVisible: importUserVisibleFromXML(xml.UserVisible, configurationSettings),
    width: xml.Width,
  })
}

registerMetadata("ImportFromXML", "SearchStringAddition", importSearchStringAdditionFromXML)
