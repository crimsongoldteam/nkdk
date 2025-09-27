import { DITokens } from "@/symbols"
import { container, injectable } from "tsyringe"
import { IXMLImportRules, I8nText } from "../../interfaces"
import { IInputField } from "./interfaces"

@injectable({ token: DITokens.InputField.XMLImportRules })
export class InputFieldXMLImportRules implements IXMLImportRules<IInputField> {
  import(xmlData: any): IInputField {
    const element = container.resolve<IInputField>(DITokens.InputField.Element)

    const inputFieldNode = xmlData.InputField

    if (!inputFieldNode) {
      return element
    }

    if (inputFieldNode._name) {
      element.name = inputFieldNode._name
    }

    if (inputFieldNode.Title) {
      element.title = {} as I8nText
      for (const item of inputFieldNode.Title) {
        const itemContent = item["v8:item"]
        const lang = itemContent["v8:lang"]
        const content = itemContent["v8:content"]
        element.title[lang as keyof I8nText] = content
      }
    }

    return element
  }
}
