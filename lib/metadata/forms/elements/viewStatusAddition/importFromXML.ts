import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormItemAdditionFromXML } from "~/lib/metadata/forms/elements/formItemAddition/importFromXML"
import { ViewStatusAddition, ViewStatusAdditionXML } from "~/lib/metadata/forms/elements/viewStatusAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importViewStatusAdditionFromXML = (
  configurationSettings: ConfigurationSettings,
  xml: ViewStatusAdditionXML | undefined
): ViewStatusAddition | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormItemAdditionFromXML(configurationSettings, xml)!,
    elementType: FormElementType.ViewStatusAddition,

    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(configurationSettings, xml.BackColor),
    border: importBorderFromXML(configurationSettings, xml.Border),
    borderColor: importColorFromXML(configurationSettings, xml.BorderColor),
    buttonsBackColor: importColorFromXML(configurationSettings, xml.ButtonsBackColor),
    font: importFontFromXML(configurationSettings, xml.Font),
    horizontalAlign: xml.HorizontalAlign,
    horizontalStretch: xml.HorizontalStretch,
    maxWidth: xml.MaxWidth,
    textColor: importColorFromXML(configurationSettings, xml.TextColor),
    titleFont: importFontFromXML(configurationSettings, xml.TitleFont),
    titleTextColor: importColorFromXML(configurationSettings, xml.TitleTextColor),
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
    width: xml.Width,
  })
}

registerMetadata("ImportFromXML", "ViewStatusAddition", importViewStatusAdditionFromXML)
