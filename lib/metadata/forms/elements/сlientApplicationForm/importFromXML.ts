import { TClientApplicationForm, TClientApplicationFormXML } from "./types"
import importI8nXmlText from "~/lib/xml/import/importI8nTextFromXML"
import importInputFieldFromXML from "../inputField/importFromXML"

export default function importClientApplicationFormFromXML(xml: TClientApplicationFormXML): TClientApplicationForm {
  const result: TClientApplicationForm = {
    autoCommandBar: xml.Form.AutoCommandBar
      ? {
          name: xml.Form.AutoCommandBar._name,
          id: xml.Form.AutoCommandBar._id,
        }
      : undefined,
    title: importI8nXmlText(xml.Form.Title),
    items: xml.Form.ChildItems.map((item) => importInputFieldFromXML(item)),
  }
  return result
}
