import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormItemAdditionFromXML } from "~/metadata/forms/elements/formItemAddition/importFromXML"
import { SearchStringAddition, SearchStringAdditionXML } from "~/metadata/forms/elements/searchStringAddition/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importSearchStringAdditionFromXML = (
  context: ConfigurationContext,
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
