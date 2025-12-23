import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { importFormItemAdditionFromXML } from "~/lib/metadata/forms/elements/formItemAddition/importFromXML"
import {
  SearchControlAddition,
  SearchControlAdditionXML,
} from "~/lib/metadata/forms/elements/searchControlAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

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
