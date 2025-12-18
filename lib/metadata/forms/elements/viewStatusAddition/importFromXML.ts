import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormItemAdditionFromXML } from "~/lib/metadata/forms/elements/formItemAddition/importFromXML"
import { ViewStatusAddition, ViewStatusAdditionXML } from "~/lib/metadata/forms/elements/viewStatusAddition/types"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importViewStatusAdditionFromXML = (
  xml: ViewStatusAdditionXML | undefined,
  configurationSettings: ConfigurationSettings
): ViewStatusAddition | undefined => {
  if (!xml) return undefined

  return {
    ...importFormItemAdditionFromXML(xml, configurationSettings)!,
    elementType: FormElementType.ViewStatusAddition,

    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(xml.BackColor, configurationSettings),
    border: importBorderFromXML(xml.Border, configurationSettings),
    borderColor: importColorFromXML(xml.BorderColor, configurationSettings),
    buttonsBackColor: importColorFromXML(xml.ButtonsBackColor, configurationSettings),
    font: importFontFromXML(xml.Font, configurationSettings),
    horizontalAlign: xml.HorizontalAlign,
    horizontalStretch: xml.HorizontalStretch,
    maxWidth: xml.MaxWidth,
    textColor: importColorFromXML(xml.TextColor, configurationSettings),
    titleFont: importFontFromXML(xml.TitleFont, configurationSettings),
    titleTextColor: importColorFromXML(xml.TitleTextColor, configurationSettings),
    width: xml.Width,
    userVisible: importUserVisibleFromXML(xml.UserVisible, configurationSettings),
  }
}

registerMetadata("ImportFromXML", "ViewStatusAddition", importViewStatusAdditionFromXML)
