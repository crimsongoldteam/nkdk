import { DITokens } from "@/symbols"
import { container, injectable } from "tsyringe"
import { IXMLTransform } from "../../interfaces"
import { IInputField } from "./interfaces"

@injectable({ token: DITokens.InputField.XMLTransform })
export class InputFieldXMLTransform implements IXMLTransform {
  nodeName = "InputField"

  import(element: IInputField): void {
    // Implementation for importing from XML
  }

  export(element: IInputField): void {
    // Implementation for exporting to XML
  }
}
