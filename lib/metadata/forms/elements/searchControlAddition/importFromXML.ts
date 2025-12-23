import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormItemAdditionFromXML } from "~/lib/metadata/forms/elements/formItemAddition/importFromXML"
import {
  SearchControlAddition,
  SearchControlAdditionXML,
} from "~/lib/metadata/forms/elements/searchControlAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importSearchControlAdditionFromXML = (
  configurationSettings: ConfigurationSettings,
  xml: SearchControlAdditionXML | undefined
): SearchControlAddition | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormItemAdditionFromXML(configurationSettings, xml)!,
    elementType: FormElementType.SearchControlAddition,

    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(configurationSettings, xml.BackColor),
    borderColor: importColorFromXML(configurationSettings, xml.BorderColor),
    font: importFontFromXML(configurationSettings, xml.Font),
    horizontalStretch: xml.HorizontalStretch,
    maxWidth: xml.MaxWidth,
    textColor: importColorFromXML(configurationSettings, xml.TextColor),
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
    width: xml.Width,
  })
}

registerMetadata("ImportFromXML", "SearchControlAddition", importSearchControlAdditionFromXML)
