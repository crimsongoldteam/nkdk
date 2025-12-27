import { importBorderFromXML } from "~/packages/core/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/packages/core/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/packages/core/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/packages/core/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/packages/core/metadata/context/types"
import { importFormItemAdditionFromXML } from "~/packages/core/metadata/forms/elements/formItemAddition/importFromXML"
import {
  ViewStatusAddition,
  ViewStatusAdditionXML,
} from "~/packages/core/metadata/forms/elements/viewStatusAddition/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"

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
