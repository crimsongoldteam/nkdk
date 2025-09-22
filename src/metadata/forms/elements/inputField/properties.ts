import { DITokens } from "@/symbols"
import { IInputFieldProperties } from "./interfaces"
import { Expose } from "class-transformer"
import { injectable } from "tsyringe"
import * as SystemEnumeration from "@/metadata/systemEnumerations"

@injectable({ token: DITokens.InputField.Properties })
export class InputFieldProperties implements IInputFieldProperties {
  @Expose({ name: "Заголовок" })
  title?: string

  @Expose({ name: "Вид" })
  type?: SystemEnumeration.FormFieldType = SystemEnumeration.FormFieldType.InputField

  @Expose({ name: "Высота" })
  height?: number

  @Expose({ name: "Многострочный" })
  multiLine?: boolean

  @Expose({ name: "Название" })
  name?: string
}
