import { DITokens } from "@/symbols"
import { Expose } from "class-transformer"
import { injectable } from "tsyringe"
import { IXMLTransform, IFormElement } from "../../interfaces"
import { IInputField } from "./interfaces"

@injectable({ token: DITokens.InputField.XMLTransform })
export class InputFieldXMLTransform implements IXMLTransform {
  public nodeName: string = "InputField"

  @Expose({ name: "Title" })
  public title?: string

  @Expose({ name: "@_name" })
  public name?: string

  import(_element: IFormElement): void {
    throw new Error("Method not implemented.")
  }

  export(element: IInputField): void {
    Object.assign(this, element.properties)
  }
}
