import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { importFormItemAdditionFromXML } from "~/lib/metadata/forms/elements/formItemAddition/importFromXML"
import { SearchStringAddition, SearchStringAdditionXML } from "~/lib/metadata/forms/elements/searchStringAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importSearchStringAdditionFromXML = (
  context: Context,
  xml: SearchStringAdditionXML | undefined
): SearchStringAddition | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormItemAdditionFromXML(context, xml)!,
    elementType: FormElementType.SearchStringAddition,

    backColor: importColorFromXML(context, xml.BackColor),
    borderColor: importColorFromXML(context, xml.BorderColor),
    font: importFontFromXML(context, xml.Font),
    horizontalStretch: xml.HorizontalStretch,
    textColor: importColorFromXML(context, xml.TextColor),
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    width: xml.Width,
  })
}

registerMetadata("ImportFromXML", "SearchStringAddition", importSearchStringAdditionFromXML)
