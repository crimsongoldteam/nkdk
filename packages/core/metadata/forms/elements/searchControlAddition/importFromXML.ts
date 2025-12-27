import { importColorFromXML } from "~/packages/core/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/packages/core/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/packages/core/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/packages/core/metadata/context/types"
import { importFormItemAdditionFromXML } from "~/packages/core/metadata/forms/elements/formItemAddition/importFromXML"
import {
  SearchControlAddition,
  SearchControlAdditionXML,
} from "~/packages/core/metadata/forms/elements/searchControlAddition/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"

export const importSearchControlAdditionFromXML = (
  context: Context,
  xml: SearchControlAdditionXML | undefined
): SearchControlAddition | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormItemAdditionFromXML(context, xml)!,
    elementType: FormElementType.SearchControlAddition,

    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(context, xml.BackColor),
    borderColor: importColorFromXML(context, xml.BorderColor),
    font: importFontFromXML(context, xml.Font),
    horizontalStretch: xml.HorizontalStretch,
    maxWidth: xml.MaxWidth,
    textColor: importColorFromXML(context, xml.TextColor),
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    width: xml.Width,
  })
}

registerMetadata("ImportFromXML", "SearchControlAddition", importSearchControlAdditionFromXML)
