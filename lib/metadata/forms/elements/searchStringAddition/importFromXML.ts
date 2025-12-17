import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importFormItemAdditionFromXML } from "~/lib/metadata/forms/elements/formItemAddition/importFromXML"
import { SearchStringAddition, SearchStringAdditionXML } from "~/lib/metadata/forms/elements/searchStringAddition/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importSearchStringAdditionFromXML = (
  xml: SearchStringAdditionXML | undefined
): SearchStringAddition | undefined => {
  if (!xml) return undefined

  return {
    ...importFormItemAdditionFromXML(xml)!,
    elementType: FormElementType.SearchStringAddition,

    backColor: importColorFromXML(xml.BackColor),
    borderColor: importColorFromXML(xml.BorderColor),
    font: importFontFromXML(xml.Font),
    horizontalStretch: xml.HorizontalStretch,
    textColor: importColorFromXML(xml.TextColor),
    width: xml.Width,
    userVisible: importUserVisibleFromXML(xml.UserVisible),
  }
}

registerImport(FormElementType.SearchStringAddition, importSearchStringAdditionFromXML)
