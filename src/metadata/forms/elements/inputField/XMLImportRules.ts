import { DITokens } from "@/symbols"
import { container, injectable } from "tsyringe"
import { IXMLImportRules } from "../../interfaces"
import { IInputField } from "./interfaces"

@injectable({ token: DITokens.InputField.XMLImportRules })
export class InputFieldXMLImportRules implements IXMLImportRules<IInputField> {
  import(xmlData: any): IInputField {
    const element = container.resolve<IInputField>(DITokens.InputField.Element)

    const inputFieldNode = xmlData.InputField

    if (!inputFieldNode) {
      return element
    }

    if (inputFieldNode.Title) {
      element.title = inputFieldNode.Title
    }

    return element
  }
}
