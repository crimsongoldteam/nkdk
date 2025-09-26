import { DITokens } from "@/symbols"
import { injectable } from "tsyringe"
import { IXMLTransform } from "../../interfaces"
import { i8nTransform } from "@/xml/i8nTransform"
import { IInputField } from "./interfaces"
import { Expose } from "class-transformer"

@injectable({ token: DITokens.InputField.XMLTransform })
export class InputFieldXMLTransform implements IXMLTransform {
  public nodeName: string = "InputField"

  @Expose({ name: "@_name" })
  public name?: string

  @Expose({ name: "Title" })
  public title?: Object = {}

  import(element: IInputField): void {
    Object.assign(this, element.properties)

    this.title = i8nTransform(element.properties.title)
  }

  export(element: IInputField): void {
    Object.assign(this, element.properties)

    this.title = i8nTransform(element.properties.title)
  }
}
