import { z } from "zod"
import { ZInputField, ZInputFieldXML } from "./types"
import importI8nXmlText from "~/lib/metadata/i8nText/importI8nTextFromXML"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"

type TInputField = z.infer<typeof ZInputField>
type TInputFieldXML = z.infer<typeof ZInputFieldXML>

export default function importInputFieldFromXML(xml: TInputFieldXML): TInputField {
  const result: TInputField = {
    name: xml.InputField._name,
    id: xml.InputField._id,
    title: importI8nXmlText(xml.InputField.Title),
    type: ElementType.InputField,
  }
  return result
}
