import { TInputField, TInputFieldXML } from "./types"
import importI8nXmlText from "~/lib/metadata/i8nText/importI8nTextFromXML"
import { ZElementType } from "~/lib/metadata/systemEnumerations/types"
import { baseElementXMLDecode } from "../baseElement/decodeXML"

export default function importInputFieldFromXML(xml: TInputFieldXML): TInputField {
  const result: TInputField = {
    ...baseElementXMLDecode(xml),
    title: importI8nXmlText(xml.Title),
    type: ZElementType.enum.InputField,
  }
  return result
}
