import { z } from "zod"
import { ZInputField, ZInputFieldXML } from "./types"
import importI8nXmlText from "~/lib/xml/import/importI8nTextFromXML"

type TInputField = z.infer<typeof ZInputField>
type TInputFieldXML = z.infer<typeof ZInputFieldXML>

export default function importInputFieldFromXML(xml: TInputFieldXML): TInputField {
  const result: TInputField = {
    name: xml._name,
    title: importI8nXmlText(xml.Title),
  }
  return result
}
