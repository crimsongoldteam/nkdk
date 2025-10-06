import { TInputField, TInputFieldXML } from "./types"
import exportI8nXmlTextToXML from "~/lib/xml/export/exportI8nTextToXML"

export default function exportInputFieldToXML(element: TInputField): TInputFieldXML {
  const result: TInputFieldXML = {
    InputField: {
      _name: element.name,
      _id: element.id ?? "",
      Title: exportI8nXmlTextToXML(element.title),
    },
  }
  return result
}
