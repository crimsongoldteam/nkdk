import { TClientApplicationForm, TClientApplicationFormXML, TAttribute } from "./types"
import importI8nXmlText from "~/lib/metadata/i8nText/importI8nTextFromXML"
import importAttributeFromXML from "./attributes/importFromXML"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { importElementFromXML } from "~/lib/xml/import/importerFactory"

export default function importClientApplicationFormFromXML(xml: TClientApplicationFormXML): TClientApplicationForm {
  const result: TClientApplicationForm = {
    type: ElementType.Form,
    autoCommandBar: xml.Form.AutoCommandBar
      ? {
          name: xml.Form.AutoCommandBar._name,
          id: xml.Form.AutoCommandBar._id,
        }
      : undefined,
    title: importI8nXmlText(xml.Form.Title),
    items: xml.Form.ChildItems ? xml.Form.ChildItems.map((item) => importElementFromXML(item)) : [],
    attributes:
      xml.Form.Attributes?.map((attribute) => importAttributeFromXML(attribute)).filter(
        (attr): attr is TAttribute => attr !== undefined
      ) ?? [],
  }
  return result
}
