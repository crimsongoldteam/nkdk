import { importBorderFromXML } from "~/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormItemAdditionFromXML } from "~/metadata/forms/elements/formItemAddition/importFromXML"
import { ViewStatusAddition, ViewStatusAdditionXML } from "~/metadata/forms/elements/viewStatusAddition/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importViewStatusAdditionFromXML = (
  context: ConfigurationContext,
  xml: ViewStatusAdditionXML | undefined
): ViewStatusAddition | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormItemAdditionFromXML(context, xml)!,
    elementType: FormElementType.ViewStatusAddition,

    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(context, xml.BackColor),
    border: importBorderFromXML(context, xml.Border),
    borderColor: importColorFromXML(context, xml.BorderColor),
    buttonsBackColor: importColorFromXML(context, xml.ButtonsBackColor),
    font: importFontFromXML(context, xml.Font),
    horizontalAlign: xml.HorizontalAlign,
    horizontalStretch: xml.HorizontalStretch,
    maxWidth: xml.MaxWidth,
    textColor: importColorFromXML(context, xml.TextColor),
    titleFont: importFontFromXML(context, xml.TitleFont),
    titleTextColor: importColorFromXML(context, xml.TitleTextColor),
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    width: xml.Width,
  })
}

registerMetadata("ImportFromXML", "ViewStatusAddition", importViewStatusAdditionFromXML)
