import { TClientApplicationForm, TClientApplicationFormXML } from "./types"
import importI8nXmlText from "~/lib/xml/import/importI8nTextFromXML"

export default function importClientApplicationFormFromXML(xml: TClientApplicationFormXML): TClientApplicationForm {
  const result: TClientApplicationForm = {
    title: importI8nXmlText(xml.Title),
    items: [],
  }
  return result
}
