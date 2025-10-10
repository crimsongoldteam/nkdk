import { TClientApplicationForm, TClientApplicationFormXML } from "./types"
import importI8nXmlText from "~/lib/metadata/i8nText/importI8nTextFromXML"
import importInputFieldFromXML from "../inputField/importFromXML"
import importAttributeFromXML from "./attributes/importAttributeFromXML"

export default function importClientApplicationFormFromXML(xml: TClientApplicationFormXML): TClientApplicationForm {
  const result: TClientApplicationForm = {
    autoCommandBar: xml.Form.AutoCommandBar
      ? {
          name: xml.Form.AutoCommandBar._name,
          id: xml.Form.AutoCommandBar._id,
        }
      : undefined,
    title: importI8nXmlText(xml.Form.Title),
    items: xml.Form.ChildItems ? xml.Form.ChildItems.map((item) => importInputFieldFromXML(item)) : [],
    attributes: xml.Form.Attributes?.map((attribute) => importAttributeFromXML(attribute)) ?? [],
  }
  return result
}
