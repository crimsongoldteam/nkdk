import { TInputField, TInputFieldXML } from "./types"

export default function exportInputFieldToXML(element: TInputField): TInputFieldXML {
  const result: TInputFieldXML = {
    InputField: {
      _name: element.name,
      _id: element.id ?? "",
      Title: [{ "v8:item": { "v8:lang": "ru", "v8:content": element.title?.ru ?? "" } }],
    },
  }
  return result
}
