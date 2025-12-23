import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { importFormItemAdditionFromXML } from "~/lib/metadata/forms/elements/formItemAddition/importFromXML"
import { ViewStatusAddition, ViewStatusAdditionXML } from "~/lib/metadata/forms/elements/viewStatusAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importViewStatusAdditionFromXML = (
  context: Context,
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
