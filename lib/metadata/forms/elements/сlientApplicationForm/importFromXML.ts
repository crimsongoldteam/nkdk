import { TClientApplicationForm, TClientApplicationFormXML } from "./types"
import importI8nXmlText from "~/lib/xml/import/importI8nTextFromXML"
import importInputFieldFromXML from "../inputField/importFromXML"

export default function importClientApplicationFormFromXML(xml: TClientApplicationFormXML): TClientApplicationForm {
  const result: TClientApplicationForm = {
    title: importI8nXmlText(xml.Title),
    items: xml.ChildItems.map((item) => importInputFieldFromXML(item.InputField)),
  }
  return result
}
