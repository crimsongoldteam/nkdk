import { IFormElement, I8nText } from "../../interfaces"

export interface IInputField extends IFormElement {
  title?: I8nText

  value: string | boolean | number | Date

  // isMultiline(): boolean
}
